use std::thread;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager};
use serde::{Deserialize, Serialize};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

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

// Global state for recording
static RECORDING: AtomicBool = AtomicBool::new(false);
lazy_static::lazy_static! {
    static ref AUDIO_BUFFER: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
    static ref SAMPLE_RATE: Arc<Mutex<u32>> = Arc::new(Mutex::new(44100));
}

#[tauri::command]
async fn start_recording() -> Result<(), String> {
    println!("🎤 [Rust] start_recording command invoked");

    if RECORDING.load(Ordering::SeqCst) {
        return Err("Already recording".to_string());
    }

    // Clear previous recording
    {
        let mut buffer = AUDIO_BUFFER.lock().unwrap();
        buffer.clear();
    }

    RECORDING.store(true, Ordering::SeqCst);

    thread::spawn(move || {
        let host = cpal::default_host();
        let device = match host.default_input_device() {
            Some(d) => d,
            None => {
                eprintln!("🎤 [Rust] No input device available");
                RECORDING.store(false, Ordering::SeqCst);
                return;
            }
        };

        println!("🎤 [Rust] Using input device: {}", device.name().unwrap_or_default());

        let config = match device.default_input_config() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("🎤 [Rust] Failed to get config: {}", e);
                RECORDING.store(false, Ordering::SeqCst);
                return;
            }
        };

        // Store sample rate
        {
            let mut sr = SAMPLE_RATE.lock().unwrap();
            *sr = config.sample_rate().0;
        }

        println!("🎤 [Rust] Input config: {:?}", config);

        let err_fn = |err| eprintln!("🎤 [Rust] Stream error: {}", err);

        let buffer_clone = AUDIO_BUFFER.clone();

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if !RECORDING.load(Ordering::SeqCst) {
                        return;
                    }
                    let mut buffer = buffer_clone.lock().unwrap();
                    buffer.extend_from_slice(data);
                },
                err_fn,
                None,
            ),
            cpal::SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    if !RECORDING.load(Ordering::SeqCst) {
                        return;
                    }
                    let mut buffer = buffer_clone.lock().unwrap();
                    // Convert i16 to f32
                    for &sample in data {
                        buffer.push(sample as f32 / i16::MAX as f32);
                    }
                },
                err_fn,
                None,
            ),
            _ => {
                eprintln!("🎤 [Rust] Unsupported sample format");
                RECORDING.store(false, Ordering::SeqCst);
                return;
            }
        };

        match stream {
            Ok(stream) => {
                println!("🎤 [Rust] Starting audio stream...");
                if let Err(e) = stream.play() {
                    eprintln!("🎤 [Rust] Failed to play stream: {}", e);
                    RECORDING.store(false, Ordering::SeqCst);
                    return;
                }

                println!("✅ [Rust] Recording started");

                // Keep stream alive while recording
                while RECORDING.load(Ordering::SeqCst) {
                    thread::sleep(std::time::Duration::from_millis(100));
                }

                println!("🎤 [Rust] Stopping recording...");
                drop(stream);
                println!("✅ [Rust] Recording stopped");
            }
            Err(e) => {
                eprintln!("🎤 [Rust] Failed to build input stream: {}", e);
                RECORDING.store(false, Ordering::SeqCst);
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn stop_recording() -> Result<String, String> {
    println!("🛑 [Rust] stop_recording command invoked");
    RECORDING.store(false, Ordering::SeqCst);

    // Wait a bit for the stream to finish
    thread::sleep(std::time::Duration::from_millis(200));

    // Get the recorded audio
    let buffer = AUDIO_BUFFER.lock().unwrap();
    let sample_rate = *SAMPLE_RATE.lock().unwrap();

    if buffer.is_empty() {
        return Err("No audio recorded".to_string());
    }

    println!("🎵 [Rust] Encoding {} samples at {} Hz", buffer.len(), sample_rate);

    // Encode to WAV
    let mut wav_data = Vec::new();
    {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = hound::WavWriter::new(std::io::Cursor::new(&mut wav_data), spec)
            .map_err(|e| format!("Failed to create WAV writer: {}", e))?;

        for &sample in buffer.iter() {
            let sample_i16 = (sample * i16::MAX as f32) as i16;
            writer.write_sample(sample_i16)
                .map_err(|e| format!("Failed to write sample: {}", e))?;
        }

        writer.finalize()
            .map_err(|e| format!("Failed to finalize WAV: {}", e))?;
    }

    println!("✅ [Rust] WAV encoded: {} bytes", wav_data.len());

    // Convert to base64
    let base64_audio = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &wav_data);

    Ok(base64_audio)
}

#[tauri::command]
async fn start_oauth_listener(app_handle: tauri::AppHandle) -> Result<(), String> {
    thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:8080")
            .map_err(|e| format!("Failed to start server: {}", e))
            .unwrap();

        // Wait for one request (the OAuth callback)
        if let Ok(request) = server.recv() {
            let url = request.url().to_string();

            // Send a simple HTML response
            let response = tiny_http::Response::from_string(
                r#"<!DOCTYPE html>
                <html>
                <head><title>Sign In Successful</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Sign in successful!</h1>
                    <p>You can close this window and return to AlgoVox.</p>
                    <script>setTimeout(() => window.close(), 2000);</script>
                </body>
                </html>"#
            ).with_header(
                tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap()
            );

            let _ = request.respond(response);

            // Emit the URL to the frontend
            let _ = app_handle.emit("oauth-callback", url);
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            start_oauth_listener,
            test_stt,
            test_tts,
            start_recording,
            stop_recording
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
