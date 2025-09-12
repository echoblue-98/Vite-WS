import requests

url = "http://127.0.0.1:8000/voice/analyze_voice"
files = {"audio": open(r"C:\Windows\Media\chimes.wav", "rb")}
data = {"prompt_index": 0, "responses": "[]"}
response = requests.post(url, data=data, files=files)
print(response.status_code)
print(response.json())
