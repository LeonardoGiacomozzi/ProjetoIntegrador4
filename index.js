'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'ws://projetointegrador-lpviyk.firebaseio.com/'
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function handleSaveDB(agent) {
    const nm_paciente = agent.parameters.nome_paciente;
    const nm_medico = agent.parameters.nome_medico;
    const dt_consulta = agent.parameters.data_consulta;
    return admin.database().ref('Paciente').push({
      nm_paciente: nm_paciente,
      nm_medico: nm_medico,
      dt_consulta: dt_consulta
    });
  }

  function handleReadDB(agent) {
    const text = agent.parameters.text;

    return admin.database().ref('Medico').once("value").then((snapshot) => {
      var medico = snapshot.child("nm_medico").val();
      var especialidade = snapshot.child("ds_especialidade").val();
      var control = medico.split(';').length
      var content = ' ';
      for (let index = 0; index < control; index++) {
       content = content.concat("\n Médico: " + medico.split(";")[index]  + "  Especialidade: " + especialidade.split(";")[index] + '.');
      }
      
      agent.add(content);
    });

  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('SaveDB', handleSaveDB);
  intentMap.set('ReadDB', handleReadDB);
  agent.handleRequest(intentMap);
});
