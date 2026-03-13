use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::{Deserialize, Serialize};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tokio::sync::mpsc;
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tauri::Emitter;

#[derive(Serialize)]
struct DeepgramRequest {
    url: String,
}

#[derive(Serialize)]
struct DeepgramTTSRequest {
    text: String,
}

#[derive(Deserialize, Debug)]
struct DeepgramResponse {
    results: DeepgramResults,
}

#[derive(Deserialize, Debug)]
struct DeepgramResults {
    channels: Vec<DeepgramChannel>,
}

#[derive(Deserialize, Debug)]
struct DeepgramChannel {
    alternatives: Vec<DeepgramAlternative>,
}

#[derive(Deserialize, Debug)]
struct DeepgramAlternative {
    transcript: String,
}

#[tauri::command]
async fn test_stt() -> Result<String, String> {
    println!("🎤 [Rust] test_stt command invoked");

    // Load .env from project root
    let env_path = std::env::current_dir()
        .map_err(|e| format!("Failed to get current dir: {}", e))?
        .join(".env");

    println!("📁 [Rust] Loading .env from: {:?}", env_path);
    dotenvy::from_path(&env_path).ok(); // Load .env if it exists

    let api_key = std::env::var("DEEPGRAM_API_KEY")
        .map_err(|_| "DEEPGRAM_API_KEY not found in .env".to_string())?;

    println!("🔑 [Rust] API key loaded (length: {})", api_key.len());

    let client = reqwest::Client::new();

    let body = DeepgramRequest {
        url: "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav".to_string(),
    };

    println!("📡 [Rust] Sending request to Deepgram...");
    let response = client
        .post("https://api.deepgram.com/v1/listen?model=base")
        .header("Authorization", format!("Token {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    println!("📨 [Rust] Response status: {}", status);

    let text = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        println!("❌ [Rust] Deepgram API error: {}", text);
        return Err(format!("Deepgram API error ({}): {}", status, text));
    }

    println!("📝 [Rust] Parsing response...");
    let deepgram_response: DeepgramResponse = serde_json::from_str(&text)
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let transcript = deepgram_response
        .results
        .channels
        .first()
        .and_then(|ch| ch.alternatives.first())
        .map(|alt| alt.transcript.clone())
        .ok_or("No transcript found in response")?;

    println!("✅ [Rust] Success! Transcript: {}", transcript);
    Ok(transcript)
}

#[tauri::command]
async fn test_tts() -> Result<String, String> {
    println!("🔊 [Rust] test_tts command invoked");

    let env_path = std::env::current_dir()
        .map_err(|e| format!("Failed to get current dir: {}", e))?
        .join(".env");

    dotenvy::from_path(&env_path).ok();

    let api_key = std::env::var("DEEPGRAM_API_KEY")
        .map_err(|_| "DEEPGRAM_API_KEY not found in .env".to_string())?;

    println!("🔑 [Rust] API key loaded");

    let client = reqwest::Client::new();

    let body = DeepgramTTSRequest {
        text: "Hello! This is a test of Deepgram's text to speech.".to_string(),
    };

    println!("📡 [Rust] Sending TTS request to Deepgram...");
    let response = client
        .post("https://api.deepgram.com/v1/speak?model=aura-asteria-en")
        .header("Authorization", format!("Token {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    println!("📨 [Rust] Response status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ [Rust] Deepgram TTS error: {}", error_text);
        return Err(format!("Deepgram TTS error ({}): {}", status, error_text));
    }

    let audio_bytes = response.bytes().await
        .map_err(|e| format!("Failed to read audio bytes: {}", e))?;

    println!("🎵 [Rust] Received {} bytes of audio", audio_bytes.len());

    // Convert to base64 for transport to frontend
    let base64_audio = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &audio_bytes);

    println!("✅ [Rust] TTS Success! Sending audio to frontend");
    Ok(base64_audio)
}

// Global state for Flux agent
static FLUX_RUNNING: AtomicBool = AtomicBool::new(false);
static AUDIO_CALLBACK_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn start_flux_agent(app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("🚀 [Rust] start_flux_agent command invoked");

    if FLUX_RUNNING.load(Ordering::SeqCst) {
        return Err("Flux agent already running".to_string());
    }

    // Try loading .env from parent directory (project root)
    let env_path = std::env::current_dir()
        .map_err(|e| format!("Failed to get current dir: {}", e))?
        .parent()
        .ok_or("No parent directory")?
        .join(".env");

    println!("🔍 [Rust] Looking for .env at: {:?}", env_path);
    dotenvy::from_path(&env_path).ok();

    let api_key_deepgram = std::env::var("DEEPGRAM_API_KEY")
        .map_err(|_| "DEEPGRAM_API_KEY not found in .env".to_string())?;

    let api_key_claude = std::env::var("ANTHROPIC_API_KEY")
        .map_err(|_| "ANTHROPIC_API_KEY not found in .env".to_string())?;

    FLUX_RUNNING.store(true, Ordering::SeqCst);

    // Spawn the flux loop in a background task
    tokio::spawn(async move {
        if let Err(e) = run_flux_loop(app_handle, api_key_deepgram, api_key_claude).await {
            eprintln!("❌ Flux loop error: {}", e);
        }
        FLUX_RUNNING.store(false, Ordering::SeqCst);
    });

    Ok(())
}

#[tauri::command]
fn stop_flux_agent() -> Result<(), String> {
    println!("🛑 [Rust] stop_flux_agent command invoked");
    FLUX_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

async fn run_flux_loop(
    app_handle: tauri::AppHandle,
    api_key_deepgram: String,
    api_key_claude: String,
) -> Result<(), String> {
    println!("🎤 Starting Flux agent loop...");
    println!("🔑 Deepgram key length: {}", api_key_deepgram.len());
    println!("🔑 Claude key length: {}", api_key_claude.len());

    // Build WebSocket URL for Deepgram Flux
    let ws_url = "wss://api.deepgram.com/v1/listen?model=flux-general-en&encoding=linear16&sample_rate=16000&channels=1";
    println!("🌐 Connecting to: {}", ws_url);

    // Create WebSocket connection with auth header
    let request = tokio_tungstenite::tungstenite::http::Request::builder()
        .uri(ws_url)
        .header("Authorization", format!("Token {}", api_key_deepgram))
        .body(())
        .map_err(|e| {
            eprintln!("❌ Failed to build WS request: {}", e);
            format!("Failed to build WS request: {}", e)
        })?;

    println!("📡 Attempting WebSocket connection...");
    let (ws_stream, response) = connect_async(request)
        .await
        .map_err(|e| {
            eprintln!("❌ WebSocket connection failed: {}", e);
            format!("Failed to connect to Deepgram: {}", e)
        })?;

    println!("✅ Connected to Deepgram Flux - Status: {:?}", response.status());

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Channel for audio data
    let (audio_tx, mut audio_rx) = mpsc::channel::<Vec<u8>>(100);

    // Spawn audio capture thread
    let audio_tx_clone = audio_tx.clone();
    thread::spawn(move || {
        println!("🎤 Audio capture thread started");
        if let Err(e) = capture_audio_for_flux(audio_tx_clone) {
            eprintln!("Audio capture error: {}", e);
        }
    });

    // Spawn task to send audio to WebSocket
    let mut audio_count = 0;
    tokio::spawn(async move {
        while let Some(audio_data) = audio_rx.recv().await {
            if !FLUX_RUNNING.load(Ordering::SeqCst) {
                break;
            }
            audio_count += 1;
            if audio_count % 100 == 0 {
                println!("🔊 Sent {} audio chunks to Deepgram", audio_count);
            }
            if ws_sender.send(Message::Binary(audio_data)).await.is_err() {
                eprintln!("❌ Failed to send audio to WebSocket");
                break;
            }
        }
    });

    // Listen for transcripts from Deepgram
    while FLUX_RUNNING.load(Ordering::SeqCst) {
        match ws_receiver.next().await {
            Some(Ok(Message::Text(text))) => {
                println!("📨 Deepgram message: {}", text); // Debug: show all messages

                // Parse Deepgram response
                if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                    // Check for EndOfTurn event with transcript
                    if response["speech_final"].as_bool() == Some(true)
                        && response["is_final"].as_bool() == Some(true)
                    {
                        if let Some(transcript) = response["channel"]["alternatives"][0]["transcript"].as_str() {
                            if !transcript.trim().is_empty() {
                                println!("📝 User said: {}", transcript);

                                // Call Claude API
                                match call_claude_api(&api_key_claude, transcript).await {
                                    Ok(claude_response) => {
                                        println!("🤖 Claude responds: {}", claude_response);

                                        // Call Deepgram TTS
                                        match call_deepgram_tts(&api_key_deepgram, &claude_response).await {
                                            Ok(audio_base64) => {
                                                // Emit audio to React via Tauri event
                                                let _ = app_handle.emit("tts-response", audio_base64);
                                                println!("🔊 TTS audio sent to frontend");
                                            }
                                            Err(e) => eprintln!("TTS error: {}", e),
                                        }
                                    }
                                    Err(e) => eprintln!("Claude error: {}", e),
                                }
                            }
                        }
                    }
                }
            }
            Some(Ok(_)) => {} // Ignore other message types
            Some(Err(e)) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            None => break,
        }
    }

    println!("✅ Flux agent loop stopped");
    Ok(())
}

fn capture_audio_for_flux(tx: mpsc::Sender<Vec<u8>>) -> Result<(), String> {
    println!("🎙️ Initializing audio capture...");

    let host = cpal::default_host();
    println!("🎙️ Got audio host");

    let device = host.default_input_device()
        .ok_or_else(|| {
            eprintln!("❌ No input device available");
            "No input device available".to_string()
        })?;

    println!("🎙️ Got input device: {:?}", device.name());

    let config = device.default_input_config()
        .map_err(|e| {
            eprintln!("❌ Failed to get config: {}", e);
            format!("Failed to get config: {}", e)
        })?;

    println!("🎤 Audio config - Sample rate: {}, Channels: {}, Format: {:?}",
        config.sample_rate().0, config.channels(), config.sample_format());

    // Reset the callback trigger flag
    AUDIO_CALLBACK_TRIGGERED.store(false, Ordering::SeqCst);

    // Build stream based on sample format
    let stream = match config.sample_format() {
        cpal::SampleFormat::I16 => {
            println!("🎤 Using I16 sample format");
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    if !FLUX_RUNNING.load(Ordering::SeqCst) {
                        return;
                    }
                    // Log only the first callback
                    if !AUDIO_CALLBACK_TRIGGERED.swap(true, Ordering::SeqCst) {
                        println!("🎤 First I16 audio callback! Got {} samples", data.len());
                    }
                    // Convert i16 samples to bytes (little-endian linear16)
                    let bytes: Vec<u8> = data
                        .iter()
                        .flat_map(|&sample| sample.to_le_bytes().to_vec())
                        .collect();
                    let _ = tx.try_send(bytes);
                },
                |err| eprintln!("Stream error: {}", err),
                None,
            )
        },
        cpal::SampleFormat::F32 => {
            println!("🎤 Using F32 sample format");
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if !FLUX_RUNNING.load(Ordering::SeqCst) {
                        return;
                    }
                    // Log only the first callback
                    if !AUDIO_CALLBACK_TRIGGERED.swap(true, Ordering::SeqCst) {
                        println!("🎤 First F32 audio callback! Got {} samples", data.len());
                    }
                    // Convert f32 to i16 then to bytes
                    let bytes: Vec<u8> = data
                        .iter()
                        .map(|&sample| (sample * i16::MAX as f32) as i16)
                        .flat_map(|sample| sample.to_le_bytes().to_vec())
                        .collect();
                    let _ = tx.try_send(bytes);
                },
                |err| eprintln!("Stream error: {}", err),
                None,
            )
        },
        _ => {
            eprintln!("❌ Unsupported sample format: {:?}", config.sample_format());
            return Err("Unsupported sample format".to_string());
        }
    }
    .map_err(|e| {
        eprintln!("❌ Failed to build stream: {}", e);
        format!("Failed to build stream: {}", e)
    })?;

    stream.play().map_err(|e| {
        eprintln!("❌ Failed to play stream: {}", e);
        format!("Failed to play stream: {}", e)
    })?;

    println!("✅ Audio stream started - listening for audio...");

    // Keep stream alive
    while FLUX_RUNNING.load(Ordering::SeqCst) {
        thread::sleep(std::time::Duration::from_millis(100));
    }

    println!("🛑 Audio capture stopped");
    Ok(())
}

async fn call_claude_api(api_key: &str, user_message: &str) -> Result<String, String> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "system": "You are a helpful assistant. Keep responses concise and conversational.",
        "messages": [{
            "role": "user",
            "content": user_message
        }]
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("Content-Type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Claude request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Claude API error: {}", response.status()));
    }

    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

    let text = data["content"][0]["text"].as_str()
        .ok_or("No text in Claude response")?;

    Ok(text.to_string())
}

async fn call_deepgram_tts(api_key: &str, text: &str) -> Result<String, String> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "text": text
    });

    let response = client
        .post("https://api.deepgram.com/v1/speak?model=aura-asteria-en")
        .header("Authorization", format!("Token {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("TTS request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("TTS API error: {}", response.status()));
    }

    let audio_bytes = response.bytes().await
        .map_err(|e| format!("Failed to read audio: {}", e))?;

    let base64_audio = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &audio_bytes);

    Ok(base64_audio)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            test_stt,
            test_tts,
            start_flux_agent,
            stop_flux_agent
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
