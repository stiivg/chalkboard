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

	describe("All Intents: score 100, dart 20", () => {
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
				request: alexaTest.getIntentRequest("ScoreIntent", {'RoundScore': '100'}),
				says: alexaTest.t("REMAINDER_MESSAGE","201"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '20'}),
				says: alexaTest.t("REMAINDER_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("NO_BUST_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("RemainderIntent"),
				says: alexaTest.t("REMAINDER_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("LastScoreIntent"),
				says: alexaTest.t("LAST_DART_SCORE_MESSAGE", "20"), shouldEndSession: false, reprompts: alexaTest.t("LAST_DART_SCORE_MESSAGE", "20"),
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore501),
				says: alexaTest.t("SET_START_SCORE_MESSAGE","501"), shouldEndSession: true,
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore91),
				says: alexaTest.t("BAD_START_SCORE_MESSAGE"), shouldEndSession: false, reprompts: alexaTest.t("START_SCORE_RANGE_MESSAGE")
			},
			{
				request: alexaTest.getIntentRequest("SetStartScoreIntent", startScore301),
				says: alexaTest.t("SET_START_SCORE_MESSAGE",START_SCORE), shouldEndSession: true,
			},
			{
				request: alexaTest.getIntentRequest("RemoveLastScoreIntent"),
				says: alexaTest.t("REMAINDER_MESSAGE", "201"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED")
			},
			{
				request: alexaTest.getIntentRequest("DartScoreIntent", {'DartScore': '20'}),
				says: alexaTest.t("REMAINDER_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED"),
			},
			{
				request: alexaTest.getIntentRequest("BustIntent"),
				says: alexaTest.t("NO_BUST_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED")
			},
			{
				request: alexaTest.getIntentRequest("WonIntent"),
				says: alexaTest.t("NO_WIN_MESSAGE","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED")
			},
			{
				request: alexaTest.getIntentRequest("BestOutIntent"),
				says: alexaTest.t("NO_BEST_OUT","181"), shouldEndSession: false, reprompts: alexaTest.t("SCORE_UNHANDLED")
			},
			{//TODO statistics should include dart scores in the current round
				request: alexaTest.getIntentRequest("StatisticsIntent"),
				says: alexaTest.t("SINGLE_STATISTICS_MESSAGE", "100", "201"), shouldEndSession: false, reprompts: alexaTest.t("HELP_REPROMPT")
			},
			{
				request: alexaTest.getIntentRequest("ScoreIntent", scoreBad),
				says: alexaTest.t("BAD_SCORE"), shouldEndSession: false
			},
		]);
	});


});
