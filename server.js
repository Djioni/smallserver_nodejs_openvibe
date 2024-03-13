const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let isTraining = false;

function generateRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function compareValuesVC(vcData) {
  const randomInteger = generateRandomInt(1, 10);
  const randomFloat = generateRandomFloat(1.0, 5.0);
  return `(('${vcData}', ${randomInteger}), ${randomFloat.toFixed(1)})`;
}

function compareValuesSMC(smcData) {
  const randomInteger = generateRandomInt(1, 10);
  const randomFloat = generateRandomFloat(1.0, 5.0);
  return `(('${smcData}', ${randomInteger}), ${randomFloat.toFixed(1)})`;
}

async function sendCommands(ws) {
  await ws.send('ExperimentStart');

  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ws.send('START_OF_TRIAL');

    isTraining = true;
    const sendDataTask = sendData(ws);

    await new Promise(resolve => setTimeout(resolve, 10000));
    isTraining = false;
    await sendDataTask;

    await ws.send('END_OF_TRIAL');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  await ws.send('ExperimentStop');
}

async function sendData(ws) {
  while (isTraining) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const vcData = '1_green';
    const smcData = '1_red';

    const vcResult = compareValuesVC(vcData);
    const smcResult = compareValuesSMC(smcData);

    const fullVcData = `VC: ${vcResult}`;
    const fullSmcData = `SMC: ${smcResult}`;

    await ws.send(fullVcData);
    await ws.send(fullSmcData);
  }
}

wss.on('connection', function connection(ws) {
  sendCommands(ws).catch(error => console.error(error));

  ws.on('message', function incoming(message) {
    console.log(`Received: ${message}`);
  });
});

const port = process.env.PORT || 8000;
server.listen(port, function listening() {
  console.log(`Server started on port ${port}`);
});
