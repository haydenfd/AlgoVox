import random

PROBLEMS = {
    "two-sum": {
        "title": "Two Sum",
        "difficulty": "Easy",
        "tags": ["array", "hashmap"],
        "prompt": """Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists"""
    },

    "valid-parentheses": {
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "tags": ["stack", "string"],
        "prompt": """Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false

Constraints:
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'"""
    },

    "best-time-to-buy-sell-stock": {
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "tags": ["array", "sliding-window"],
        "prompt": """You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0

Constraints:
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4"""
    },

    "climbing-stairs": {
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "tags": ["dp", "math"],
        "prompt": """You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

Example 1:
Input: n = 2
Output: 2

Example 2:
Input: n = 3
Output: 3

Constraints:
- 1 <= n <= 45"""
    },

    "binary-search": {
        "title": "Binary Search",
        "difficulty": "Easy",
        "tags": ["array", "binary-search"],
        "prompt": """Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.

Example 1:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4

Example 2:
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1

Constraints:
- 1 <= nums.length <= 10^4
- -10^4 < nums[i], target < 10^4
- All integers in nums are unique
- nums is sorted in ascending order"""
    },
}


def get_random_problem() -> dict:
    """Return a random problem from the bank."""
    return random.choice(list(PROBLEMS.values()))


def get_random_problem_by_difficulty(difficulty: str) -> dict:
    """Return a random problem filtered by difficulty (Easy, Medium, Hard)."""
    filtered = [p for p in PROBLEMS.values() if p["difficulty"] == difficulty]
    if not filtered:
        raise ValueError(f"No problems found for difficulty: {difficulty}")
    return random.choice(filtered)