import io
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_analyze_voice():
	# Simulate a small WAV file in memory (header only, not real audio)
	dummy_audio = io.BytesIO(b'RIFF\x00\x00\x00\x00WAVEfmt ')
	response = client.post(
		"/voice/analyze_voice",
		files={"audio": ("chimes.wav", dummy_audio, "audio/wav")},
		data={"prompt_index": 0, "responses": "[]"}
	)
	assert response.status_code == 200
	data = response.json()
	assert "features" in data
	assert data["features"]["pitch"] == 180
	assert data["features"]["tonality"] == "Neutral"

if __name__ == "__main__":
	pytest.main()
