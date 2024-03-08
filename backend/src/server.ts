import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './.env.local' });
} else {
  dotenv.config({ path: './.env.production' });
}

import app from './app';
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
