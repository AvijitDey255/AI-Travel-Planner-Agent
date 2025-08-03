# Watson Chatbot Backend

This is a Flask backend server that handles IBM Watson API communication.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Update the `.env` file with your actual IBM API key:
```env
IBM_API_KEY=your_actual_api_key_here
```

3. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `POST /api/chat` - Send a message to Watson
- `GET /api/health` - Check server health and configuration

## Testing

You can test the API directly:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```