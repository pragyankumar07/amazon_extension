# 🚀 RapidBrowse AI Shopping Assistant

**RapidBrowse** is a lightning-fast, AI-powered Chrome Extension designed to transform your Amazon shopping experience. It uses the **Gemini 1.5 Flash AI** to parse your search queries in natural language and automatically filtering, scoring, and highlighting the best products for you.

---

## ✨ Features

- **💬 AI Chat Interface**: A premium floating panel to state your requirements (e.g., *"Best headphones under $100 with 4.5+ stars"*).
- **🧠 Intelligent Parsing**: Powered by Google Gemini to extract filters like price range, ratings, and review counts.
- **🔍 Real-time Filtering**: Instantly hides non-matching products directly on the Amazon search page.
- **🏆 RapidBrowse Top Picks**: Automatically identifies and highlights the top 3 best-matching products.
- **📊 Smart Scoring**: Each product gets a "RapidBrowse Score" based on ratings, popularity, and delivery speed.
- **💾 Filter Presets**: Remembers your last used filters across shopping sessions.

---

## 🛠️ How to Download and Use (Production/Local)

To use RapidBrowse for yourself, follow these steps to load the extension into your Chrome browser:

### 1. Download the Code
- **Option A (Git)**: Clone this repository using:
  ```bash
  git clone https://github.com/pragyankumar07/amazon_extension.git
  ```
- **Option B (ZIP)**: Click the green **"Code"** button at the top of this page and select **"Download ZIP"**. Extract the files to a folder on your computer.

### 2. Install in Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **"Developer mode"** (toggle in the top-right corner).
3. Click the **"Load unpacked"** button in the top-left.
4. Select the folder where you cloned/extracted the files (the folder containing `manifest.json`).

### 3. Start Shopping
1. Navigate to [Amazon.com](https://www.amazon.com), [Amazon.in](https://www.amazon.in), or [Amazon.co.uk](https://www.amazon.co.uk).
2. Search for any product.
3. The **RapidBrowse** panel will appear on the right side. Expand it and start typing your preferences!

---

## ⚙️ Configuration

The extension comes pre-configured with a Gemini API key for demonstration. If you'd like to use your own:
1. Open `src/background.js`.
2. Replace the `GEMINI_API_KEY` constant with your own key from [Google AI Studio](https://aistudio.google.com/).
3. Go back to `chrome://extensions/` and click the **Reload** icon on the RapidBrowse card.

---

## 📅 Scheduled Development
*This repository contains scheduled commits for continuous integration training and simulation, set for March 16th, 2026.*

---

## 📄 License
This project is for personal use and developer demonstration purposes.
