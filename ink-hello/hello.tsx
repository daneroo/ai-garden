// hello.tsx
import React from 'react';
import { Box, Text, render } from 'ink';

const App = () => (
  <Box borderStyle="round" padding={1} borderColor="green">
    <Text color="green">Hello World from Ink!</Text>
  </Box>
);

render(<App />);