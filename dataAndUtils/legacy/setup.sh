#!/bin/bash

# setup script for legacy python weather data processing scripts

set -e  # exit on error

echo "=========================================="
echo "Setting up Python environment for legacy scripts"
echo "=========================================="

# check if python is available
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

echo "Python version: $(python --version)"

# create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python -m venv venv
    echo "✓ Virtual environment created"
else
    echo ""
    echo "✓ Virtual environment already exists"
fi

# activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# install dependencies
echo ""
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "✓ Setup complete!"
echo "=========================================="
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source venv/bin/activate"
echo ""
echo "To run the main script:"
echo "  cd utils"
echo "  python CleanData_MatchCities_ExpandDatesAndWeather.py"
echo ""
