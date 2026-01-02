#!/bin/bash

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Build completed successfully!"
