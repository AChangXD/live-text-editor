'use client';
import { useEffect, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';

export default function Home() {
  /* -------------------------------------------------------------------------- */
  /*                                   States                                   */
  /* -------------------------------------------------------------------------- */
  const [clientId, setClientId] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  /* -------------------------------------------------------------------------- */
  /*                                   Effects                                  */
  /* -------------------------------------------------------------------------- */
  // Init SSE:
  useEffect(() => {
    const sse = new EventSource('http://localhost:3002/changes');
    // Error handling
    sse.onerror = (e) => {
      console.log(e);
      console.log('ERROR');
      sse.close();
    };

    // Handle messages:
    sse.onmessage = (e) => {
      // Parse the data into json because SSE return strings:
      const data = JSON.parse(e.data);

      if (data.clientId) {
        console.log('ClientID: ' + data.clientId);
        // Init states:
        setClientId(data.clientId);
        setTextContent(data.content);
        setLoading(false);
      } else if (data.content) {
        setTextContent(data.content);
      }
    };
  }, []);
  /* -------------------------------------------------------------------------- */
  /*                                 JSX Return                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography>Live Synchronous Text Editor</Typography>

        <TextField
          multiline
          inputProps={{ style: { minHeight: 700 } }}
          sx={{ border: 2, borderColor: 'red' }}
          // Disable the text box before having a clientId:
          disabled={loading}
          value={textContent}
          onChange={async (e) => {
            setTextContent(e.target.value);
            const requestOptions = {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: e.target.value }),
            };
            // Alert server:
            await fetch('http://localhost:3002/update', requestOptions);
          }}
        ></TextField>
      </Box>
    </main>
  );
}
