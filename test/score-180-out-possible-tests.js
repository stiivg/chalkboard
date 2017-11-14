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

	describe("All Intents: score 180, out possible", () => {
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
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '131'}),
				says: alexaTest.t("REMAINDER_MESSAGE","170"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{ //TODO remove trailing comma and space
				request: alexaTest.getIntentRequest("BestOutIntent"),
				says: alexaTest.t("BEST_OUT","170") + alexaTest.t("TREBLE_WORD") + " 20, "+ alexaTest.t("TREBLE_WORD") + " 20, "+ alexaTest.t("DOUBLE_WORD")+ " " +alexaTest.t("BULL_WORD"),
				shouldEndSession: false,
				reprompts: alexaTest.t("TREBLE_WORD") + " 20, "+ alexaTest.t("TREBLE_WORD") + " 20, "+ alexaTest.t("DOUBLE_WORD")+ " " +alexaTest.t("BULL_WORD")
			},
			{
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '49'}),
				says: alexaTest.t("REMAINDER_MESSAGE","121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("BUST_MESSAGE","121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("RemainderIntent"),
				says: alexaTest.t("REMAINDER_MESSAGE","121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("LastScoreIntent"),
				says: alexaTest.t("LAST_SCORE_MESSAGE", "0"), shouldEndSession: false, reprompts: alexaTest.t("LAST_SCORE_MESSAGE", "0"),
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore501),
				says: alexaTest.t("SET_START_SCORE_MESSAGE","501"), shouldEndSession: true,
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore91),
				says: alexaTest.t("BAD_START_SCORE_MESSAGE"), shouldEndSession: false, reprompts: alexaTest.t("START_SCORE_RANGE_MESSAGE")
			},
			{ // TODO should not end session
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore301),
				says: alexaTest.t("SET_START_SCORE_MESSAGE",START_SCORE), shouldEndSession: true,
			},
			{
				request: alexaTest.getIntentRequest("RemoveLastScoreIntent"),
				says: alexaTest.t("REMAINDER_MESSAGE", "121"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED")
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '20'}),
				says: alexaTest.t("REMAINDER_MESSAGE","101"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{ //TODO remove trailing comma and space
				request: alexaTest.getIntentRequest("BestOutIntent"),
				says: alexaTest.t("BEST_OUT","101") + alexaTest.t("TREBLE_WORD") + " 17,  18, "+ alexaTest.t("DOUBLE_WORD")+ " 16, ", shouldEndSession: false,
				reprompts: alexaTest.t("TREBLE_WORD") + " 17,  18, "+ alexaTest.t("DOUBLE_WORD")+ " 16, "
			},
			{//TODO statistics should include dart scores in the current round
				request: alexaTest.getIntentRequest("StatisticsIntent"),
				says: alexaTest.t("STATISTICS_MESSAGE", "2", "121", "131", "49", "90"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT")
			},
			{
				request: alexaTest.getIntentRequest("ScoreIntent", scoreBad),
				says: alexaTest.t("BAD_SCORE"), shouldEndSession: false
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("WON_MESSAGE","3", "94"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT"),
				hasAttributes: {
					// scores: '0',
					startScore: 301,
					gamesPlayed: 1,
					// dartScores:[],
					STATE: '_WONMODE'
				},
			},
		]);
	});


});
