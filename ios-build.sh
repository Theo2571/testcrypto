#!/bin/bash

# iOS Build Script for Solana Mobile SDK
# This script handles the iOS build process with proper Ruby/CocoaPods setup

set -e

echo "🔧 Setting up Ruby and CocoaPods paths..."
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"

echo "🏗️ Building web project..."
npm run build

echo "📱 Copying web assets to iOS..."
npx capacitor copy ios

echo "📦 Installing iOS pods..."
cd ios/App
pod install --verbose
cd ../..

echo "✅ iOS project is ready!"
echo ""
echo "To open in Xcode, run:"
echo "npx capacitor open ios"
echo ""
echo "Or manually open: ios/App/App.xcworkspace" 