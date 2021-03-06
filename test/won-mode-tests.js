/*
Run with 'mocha examples/skill-sample-nodejs-hello-world/helloworld-tests.js'.
*/

// include the testing framework
// const alexaTest = require('../test/node_modules/alexa-skill-test-framework');
const alexaTest = require('../test/node_modules/alexa-skill-test-framework');
// const alexaTest = require('../../index');

// initialize the testing framework
alexaTest.initialize(
	require('../index.js'),
	"amzn1.ask.skill.d86397e8-ceb5-4eed-a489-5f7c9795f512",
	"amzn1.ask.account.AFQ4NGTKW5SOKXHLRJGK7OZPC2ZQ4HWV72IOBNVNVPKU6O4NYMSXLAWWRZR35KA3ZK5MNKMNLSNG6OULXOAIFFYJOFALESPSDYAW5FRVGURABAR7OHXTQP5FU7QOB3GEUQYPXTUVY3QOWQFHE4NHAASLFSHCXMQHSKPEO2XJTGEE3II5JNARSYRFW6ZRB237QDZ52QBKOCXQ7JQ");

alexaTest.setDynamoDBTable('chalkboardDB');

// initialize i18n
var textResources = require("../bullseye-language");
alexaTest.initializeI18N(textResources);
var supportedLocales = ["en-US"];

// disable test for ? in response keeping session open
alexaTest.setExtraFeature('questionMarkCheck', false);

describe("Bull's-Eye Skill", () => {
	'use strict';

	describe("All Intents: _WONMODE", () => {
		// var speechOutput = this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE", this.attributes['startScore'].toString());
		// var repromptText = this.t("HELP_MESSAGE");
		const score100 = {'RoundScore': '100'};
		const score180 = {'RoundScore': '180'};
		const scoreBad = {'RoundScore': '181'};
		const startScore501 = {'StartScore': '501'};
		const startScore301 = {'StartScore': '301'};
		const startScore91 = {'StartScore': '91'};
		const START_SCORE = "301";
		alexaTest.test([
			{
				request: alexaTest.getLaunchRequest(),
				says: alexaTest.t("NEW_GAME_MESSAGE", alexaTest.t("GAME_NAME")) + alexaTest.t("WELCOME_MESSAGE", "301"), shouldEndSession: false, reprompts: alexaTest.t("HELP_MESSAGE"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 0,
					// dartScores:[],
					STATE: '_SCOREMODE'
				},
			},
			// All intents with score of 100
			{
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '180'}),
				says: alexaTest.t("REMAINDER_MESSAGE","121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("WON_MESSAGE","2", "151"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 1,
					// dartScores:[],
					STATE: '_WONMODE'
				},
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("RemainderIntent"),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("LastScoreIntent"),
				says: alexaTest.t("LAST_SCORE_MESSAGE", "121"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore501),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore91),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT")
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore301),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("RemoveLastScoreIntent"),
				says: alexaTest.t("REMAINDER_MESSAGE","121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 0,
					// dartScores:[],
					STATE: '_SCOREMODE'
				},
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("WON_MESSAGE","2", "151"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 1,
					// dartScores:[],
					STATE: '_WONMODE'
				},
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '20'}),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{ //TODO remove trailing comma and space
				request: alexaTest.getIntentRequest("BestOutIntent"),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{//TODO statistics should include dart scores in the current round
				request: alexaTest.getIntentRequest("StatisticsIntent"),
				says: alexaTest.t("WON_STATISTICS_MESSAGE", "2", "180", "121", "151"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT")
			},
			{
				request: alexaTest.getIntentRequest("ScoreIntent", scoreBad),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			},
			// {
			// 	request: alexaTest.getSessionEndedRequest("USER_INITIATED"),
			// 	says: alexaTest.t("WON_UNHANDLED"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
			// },
		]);
	});


});
