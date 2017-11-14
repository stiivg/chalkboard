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

	describe("Dart Scoring", () => {
		// var speechOutput = this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE", this.attributes['startScore'].toString());
		// var repromptText = this.t("HELP_MESSAGE");
		const score100 = {'RoundScore': '100'};
		const score180 = {'RoundScore': '180'};
		const dartScoreBad = {'DartScore': '61'};
		const dartScoreD5 = {
			'Multiplier': 'double',
			'DartScore': '5'
		};
		const dartScoreT9 = {
			'Multiplier': 'triple',
			'DartScore': '9'
		};
		const dartScoreBull = {
			'DartScore': 'bull'
		};
		const dartScoreDB = {
			'Multiplier': 'double',
			'DartScore': 'bull'
		};
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

			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '20'}),
				says: alexaTest.t("REMAINDER_MESSAGE","281"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},

			{
				request: alexaTest.getIntentRequest("DartScoreIntent", dartScoreD5),
				says: alexaTest.t("REMAINDER_MESSAGE","271"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},

			{ //TODO add reprompt speech
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '20'}),
				says: alexaTest.t("SCORE_TOO_LOW_MESSAGE"), shouldEndSession: false, reprompts: "",
			},
			{
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '30'}),
				says: alexaTest.t("REMAINDER_MESSAGE","271"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", dartScoreT9),
				says: alexaTest.t("REMAINDER_MESSAGE","244"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("DartBullIntent", dartScoreBull),
				says: alexaTest.t("REMAINDER_MESSAGE","219"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{ //TODO remember dart target such as 'bull' not just score of 25
				request: alexaTest.getIntentRequest("LastScoreIntent"),
				says: alexaTest.t("LAST_DART_SCORE_MESSAGE", "25"), shouldEndSession: false, reprompts: alexaTest.t("LAST_DART_SCORE_MESSAGE", "25"),
			},
			{
				request: alexaTest.getIntentRequest("DartBullIntent", dartScoreDB),
				says: alexaTest.t("REMAINDER_MESSAGE","169"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("BUST_MESSAGE","169"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '30'}),
				says: alexaTest.t("REMAINDER_MESSAGE","139"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("BUST_MESSAGE","169"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{ //TODO remove trailing comma and space
				request: alexaTest.getIntentRequest("BestOutIntent"),
				says: alexaTest.t("NO_BEST_OUT","169"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", dartScoreBad),
				says: alexaTest.t("BAD_DART_SCORE_MESSAGE"), shouldEndSession: false
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("NO_WIN_MESSAGE","169"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 0,
					// dartScores:[],
					STATE: '_SCOREMODE'
				},
			},
			{ //TODO add reprompt
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '135'}),
				says: alexaTest.t("WIN_TARGET","17"), shouldEndSession: false, reprompts: alexaTest.t("DOUBLE_WORD")+ " 17",
			},
		]);
	});

});
