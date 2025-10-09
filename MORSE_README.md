# 🔤 ⚡ Morse Code Converter

A feature-rich, interactive Morse Code Converter built with Next.js 15, React, and TypeScript.

## ✨ Features

### Core Functionality
- **Bidirectional Conversion**: Convert text to Morse code and Morse code back to text
- **Real-time Character Counter**: Track input length as you type
- **Smart Conversion**: Handles multiple words with proper spacing

### Themes 🎨
Choose from 5 beautiful themes:
- **Default**: Purple gradient
- **Dark**: Dark mode with blue accents
- **Ocean**: Cool blue tones
- **Sunset**: Warm pink and orange
- **Forest**: Green nature-inspired

### Audio Features 🔊
- **Morse Code Playback**: Hear your converted Morse code
- **Adjustable Speed**: Control playback speed (1-10 WPM)
- **Sound Toggle**: Mute/unmute audio playback
- **Realistic Morse Tones**: Authentic dot and dash sounds

### Quick Actions ⚡
- **Try Sample**: Load example text or Morse code
- **Swap Input/Output**: Quickly reverse conversion
- **UPPERCASE/lowercase**: Text transformation buttons
- **Copy to Clipboard**: One-click copy
- **Download**: Save conversions as text files

### History 📚
- **Recent Conversions**: View your last 10 conversions
- **Click to Load**: Quickly reuse previous conversions
- **Persistent Storage**: History saved in localStorage
- **Clear History**: Remove all saved conversions

### Additional Features
- **Fullscreen Mode**: Immersive experience
- **Keyboard Shortcuts**: Press Enter to convert
- **Responsive Design**: Works on all screen sizes
- **Help Section**: Built-in Morse code reference chart
- **Notifications**: Visual feedback for actions

## 🚀 Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd morse-code-decoder-app
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Use

### Text to Morse Code
1. Select **Text → Morse** mode (default)
2. Type your text in the input area
3. Click **Convert** or press Enter
4. Your Morse code will appear in the output section
5. Adjust playback speed and listen to the Morse code

### Morse Code to Text
1. Select **Morse → Text** mode
2. Enter Morse code with:
   - Single spaces between letters
   - Triple spaces between words
   - Use dots (.) and dashes (-)
3. Click **Convert** or press Enter
4. Your decoded text will appear in the output section

### Examples

**Text to Morse:**
```
Input:  Hello World
Output: .... . .-.. .-.. ---   .-- --- .-. .-.. -..
```

**Morse to Text:**
```
Input:  .... . .-.. .-.. ---   .-- --- .-. .-.. -..
Output: hello world
```

## 🎨 Themes

Switch themes using the theme selector at the top of the page. Your preference is automatically saved to localStorage.

## 🔊 Audio Playback

- Toggle sound on/off using the speaker button (top left)
- Adjust playback speed with the slider (appears after text-to-Morse conversion)
- Speed ranges from 1 to 10 WPM (Words Per Minute)

## 📱 Responsive Design

The app is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones

## 🛠️ Technologies Used

- **Next.js 15**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **CSS3**: Custom styling with CSS variables for theming
- **Web Audio API**: Morse code sound generation
- **LocalStorage API**: Persist user preferences and history

## 📁 Project Structure

```
morse-code-decoder-app/
├── src/
│   └── app/
│       ├── page.tsx      # Main Morse Code Converter component
│       ├── morse.css     # All styling for the converter
│       ├── layout.tsx    # Root layout
│       └── globals.css   # Global styles
├── public/              # Static assets
├── package.json         # Dependencies
└── README.md           # This file
```

## 🎯 Features in Detail

### Theme System
Uses CSS variables for easy theme switching. All themes maintain consistent spacing and layout while changing colors.

### Audio System
- Uses Web Audio API for precise tone generation
- Dot duration calculated based on WPM
- Dash duration = 3x dot duration
- Proper spacing between letters and words

### History System
- Stores up to 10 recent conversions
- Persists across browser sessions
- Shows mode (Text→Morse or Morse→Text)
- Click any history item to reload

### Morse Code Reference
Built-in chart showing all 26 letters and their Morse code equivalents.

## 🔐 Privacy

All data is stored locally in your browser. No data is sent to any server.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💡 Tips

- Use the **Try Sample** button to see examples
- Press **Enter** to quickly convert without clicking the button
- Use **Shift+Enter** for new lines in the textarea
- Toggle **fullscreen mode** for a distraction-free experience
- Download your conversions to keep a permanent record

## 🌟 Enjoy Converting!

Have fun learning and using Morse code! 📡
