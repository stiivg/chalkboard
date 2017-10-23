"use strict";
var APP_ID = 'amzn1.ask.skill.d86397e8-ceb5-4eed-a489-5f7c9795f512';

var GAME_STATES = {
    START: "_STARTMODE", // Entry point, start the game.
    SCORE: "_SCOREMODE", // Scoring mode.
    WON: "_WONMODE", // THe game has been won
    HELP: "_HELPMODE" // The user is asking for help.
};
// var scores = new Array();
var BEST_OUT_LIMIT = 170; //Highest remainder with out in round option
var outChart = require("./outChart");
var OUT_CHART =  outChart["OUT_CHART"];

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
var languageString = {
    "en-US": {
        "translation": {
//          "GAME_NAME" : "Darts <say-as interpret-as="spell-out">501</say-as>", // Fails - needs exscape codes
            "GAME_NAME" : "Chalkboard",
            "ASK_MESSAGE_START": "Would you like to start playing?",
            "STOP_MESSAGE": "Would you like to keep playing?",
            "CANCEL_MESSAGE": "Ok, let\'s play again soon.",
            "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
            "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
            "START_UNHANDLED": "Say start to start a new game.",
            "SCORE_UNHANDLED": "Try saying I scored 180",
            "NEW_GAME_MESSAGE": "Welcome to %s. ",
            "WELCOME_MESSAGE": "I will keep score for your game of <say-as interpret-as=\"spell-out\">%s</say-as>.",
            "WELCOME_TEXT": "I will keep score for your game of %s.",
            "REMAINDER_MESSAGE": "You have %s remaining",
            "SET_START_SCORE_MESSAGE": "This game will start from <say-as interpret-as=\"spell-out\">%s</say-as>.",
            "BAD_START_SCORE_MESSAGE": "I did not understand your start score",
            "START_SCORE_RANGE_MESSAGE": "The start score must be between <say-as interpret-as=\"spell-out\">101</say-as> and 1000 and 1",
            "LAST_SCORE_MESSAGE": "Your last score was %s",
            "NO_LAST_SCORE_MESSAGE": "You have not scored yet",
            "GAME_OVER_MESSAGE": "Thank you for playing!",
            "SCORE_IS_MESSAGE": "Your score is %s. ",
            "BAD_SCORE": "I did not understand your score",
            "SCORE_TOO_LOW_MESSAGE": "This score is less than the darts this round",
            "BAD_DART_SCORE_MESSAGE": "I did not understand your dart score",
            "WON_STATISTICS_MESSAGE": "You won in %s rounds, your highest score was %s, your lowest %s, with a points per dart of %s",
            "STATISTICS_MESSAGE": "After %s rounds you have %s remaining, your highest score was %s, your lowest %s, with a points per dart of %s",
            "SINGLE_STATISTICS_MESSAGE": "After your first round you scored %s and have %s remaining.",
            "NO_OUT": "No three dart out",
            "BEST_OUT": "With %s remaining, the best out is ",
            "NO_BEST_OUT": "With %s remaining there is no out this round",
            "TREBLE_WORD": "Treble",
            "DOUBLE_WORD": "Double",
            "BULL_WORD": "Bull",
            "WIN_TARGET": "You need double %s for the win",
            "BUST_MESSAGE": "Bust, you still have %s remaining",
            "NO_BUST_MESSAGE": "You cannot bust with %s remaining",
            "NO_WIN_MESSAGE": "You cannot win with %s remaining",
            "WON_MESSAGE": "Congratulations you have won in %s rounds, with %s points per dart",
            "WON_UNHANDLED": "This game is over"
        }
    }
};

var Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.dynamoDBTableName = 'chalkboardDB';
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, helpStateHandlers, scoreStateHandlers, wonStateHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
      //initialize the attributes if this is the first time
      if(Object.keys(this.attributes).length === 0) {
          this.attributes['scores'] = new Array();
          this.attributes['startScore'] = 301;
          this.attributes['gamesPlayed'] = 0;
          this.attributes['dartScores'] = new Array();
      }

      this.handler.state = GAME_STATES.START;
      this.emitWithState("StartGame");
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame");
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser");
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};

var startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    "StartGame": function () {
        var speechOutput = this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE", this.attributes['startScore'].toString());
        var repromptText = speechOutput;

        this.attributes['scores'] = []; //remove all scores
        this.attributes['dartScores'] = [];

        // Set the current state to score mode. The skill will now use handlers defined in scoreStateHandlers
        this.handler.state = GAME_STATES.SCORE;
        this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), this.t("WELCOME_TEXT", this.attributes['startScore'].toString()));
    }
});


var scoreStateHandlers = Alexa.CreateStateHandler(GAME_STATES.SCORE, {
    "LaunchRequest": function () {
      //initialize the attributes if this is the first time the DB is created
      if(Object.keys(this.attributes).length === 0) {
          this.attributes['scores'] = new Array();
          this.attributes['startScore'] = 301;
          this.attributes['gamesPlayed'] = 0;
          this.attributes['dartScores'] = new Array();
      }

      var speechOutput = lastScoreSpeech.call(this) + "," + remainderSpeech.call(this);
        this.emit(":ask", speechOutput, speechOutput);
    },
    "ScoreIntent": function () {
        handleUserScore.call(this);
    },

    "DartScoreIntent": function () {
        handleUserDartScore.call(this);
    },

    "RemainderIntent": function () {
      var speechOutput = remainderSpeech.call(this);
      this.emit(":tell", speechOutput);
    },


    "LastScoreIntent": function () {
      var speechOutput = lastScoreSpeech.call(this);
      this.emit(":ask", speechOutput, speechOutput);
    },

    "SetStartScoreIntent": function () {
      var speechOutput = "";
      var repromptSpeech = "";
      var startScoreSlotValid = isStartScoreSlotValid(this.event.request.intent);
      if (startScoreSlotValid) {
        var startScore = parseInt(this.event.request.intent.slots.StartScore.value);
        this.attributes['startScore'] = startScore;
        speechOutput = this.t("SET_START_SCORE_MESSAGE", startScore.toString());
        this.emit(":tell", speechOutput);
      } else {
        speechOutput = this.t("BAD_START_SCORE_MESSAGE");
        repromptSpeech = this.t("START_SCORE_RANGE_MESSAGE");
        this.emit(":ask", speechOutput, repromptSpeech);
      };
    },

    //TODO remove last dart score
    "RemoveLastScoreIntent": function () {
      var scores = this.attributes['scores'];
      if (scores.length > 0) {
        scores.pop();
        this.attributes['scores'] = scores;
        this.emitWithState("RemainderIntent");
      } else {
        var speechOutput = this.t("NO_LAST_SCORE_MESSAGE");
        this.emit(":tell", speechOutput);
      }
    },

    "BustIntent": function () {
      var speechOutput = "";
      var scores = this.attributes['scores'];
      var remaining = remainingValue.call(this);
      if (remaining <= 180) { //ensure bust is possible
        this.attributes['dartScores'] = []; //remove all dart scores
        scores.push(0); //add a zero round for statistics
        this.attributes['scores']= scores;
        speechOutput = this.t("BUST_MESSAGE", remainingToDouble.call(this, remaining));
      } else {
        speechOutput = this.t("NO_BUST_MESSAGE", remaining.toString());
      }
      this.emit(":tell", speechOutput);
    },

    "WonIntent": function () {
      var speechOutput = "";
      var scores = this.attributes['scores'];
      var remaining = remainingValue.call(this);
      if (remaining <= 170) { //ensure win is possible
        this.attributes['dartScores'] = []; //remove all dart scores
        scores.push(remaining); //must have scored remainder
        this.attributes['scores']= scores;
        this.handler.state = GAME_STATES.WON;
        this.attributes['gamesPlayed'] += 1;
        speechOutput = gameWonSpeech.call(this);
      } else {
        speechOutput = this.t("NO_WIN_MESSAGE", remaining.toString());
      }
      this.emit(":tell", speechOutput);
    },

    "StatisticsIntent": function () {
        handleStatistics.call(this);
    },

    //TODO handle darts remaining less than 3
    "BestOutIntent": function () {
        // console.log("DEBUG OUT_CHART: " + OUT_CHART.toString());
        var speechOutput = "";
        var repromptSpeech = "";
        var remaining = remainingValue.call(this);
        if (remaining <= BEST_OUT_LIMIT) {
          var speeches = bestOutSpeech.call(this);
          speechOutput = speeches.speechOutput;
          repromptSpeech = speeches.repromptSpeech;
        } else {
          speechOutput = this.t("NO_BEST_OUT",remaining.toString())
        }
        if (repromptSpeech == "") {
          this.emit(":tell", speechOutput);
        } else {
          this.emit(":ask", speechOutput, repromptSpeech);
        }
    },

    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame");
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("SCORE_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in score state: " + this.event.request.reason);
        this.emit(':tell', "Goodbye!");
}
});

//The game has been won keep statistics until a new game is started
var wonStateHandlers = Alexa.CreateStateHandler(GAME_STATES.WON, {
    "LastScoreIntent": function () {
      var speechOutput = lastScoreSpeech.call(this);
      this.emit(":ask", speechOutput, speechOutput);
    },

    "StatisticsIntent": function () {
        handleStatistics.call(this);
    },

    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame");
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },

    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },

    "Unhandled": function () {
        var speechOutput = this.t("WON_UNHANDLED");
        this.emit(":ask", speechOutput, "");
    },

    "SessionEndedRequest": function () {
        console.log("Session ended in won state: " + this.event.request.reason);
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    "helpTheUser": function (newGame) {
        var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("REPEAT_QUESTION_MESSAGE") + this.t("STOP_MESSAGE");
        var speechOutput = this.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
        var repromptText = this.t("HELP_REPROMPT") + askMessage;
        this.emit(":ask", speechOutput, repromptText);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame");
    },
    "AMAZON.RepeatIntent": function () {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.HelpIntent": function() {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["speechOutput"] && this.attributes["repromptText"]) {
            this.handler.state = GAME_STATES.SCORE;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = GAME_STATES.START;
            this.emitWithState("StartGame");
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t("NO_MESSAGE");
        this.emit(":tell", speechOutput);
    },
    "AMAZON.StopIntent": function () {
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("HELP_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

//TODO handle dartScores with less than 3 darts remaining
function bestOutSpeech() {
  var remaining = remainingValue.call(this);
  var speechOutput = this.t("BEST_OUT", remaining.toString());
  var repromptSpeech = "";
  //if remaining less then end of chart just state remaining
  var outChartIndex = BEST_OUT_LIMIT - remaining;
  if (outChartIndex >= OUT_CHART.length) {
    //small remainder less than outChart
    if (isEven(remaining)) {
      var doubleRemStr = (remaining/2).toString();
      speechOutput = this.t("WIN_TARGET",doubleRemStr);
      repromptSpeech = this.t("DOUBLE_WORD") + doubleRemStr;
    } else {
      speechOutput = remainderSpeech.call(this);
    }
  } else {
    var bestOutTargets = OUT_CHART[outChartIndex];
    // console.log("DEBUG: OUT_CHART =" + OUT_CHART.toString());
    if (bestOutTargets.length == 0) { //test for none entry in out chart
      speechOutput = this.t("NO_BEST_OUT",remaining.toString())
    } else {
      for (var i = 0; i < bestOutTargets.length; i++) {
        repromptSpeech += targetToSpeech.call(this, bestOutTargets[i]);
      }
      speechOutput += repromptSpeech;
    }
  }
  return {
    speechOutput: speechOutput,
    repromptSpeech: repromptSpeech
  };
}

function isEven(n) {
   return n % 2 == 0;
}
// converts a target such as T20 to string "Treble Twenty"
//supports T20, D19, B, DB, 18
function targetToSpeech(target) {
  var speechOutput = "";
  // console.log("DEBUG: target = " + target);
  if (target.startsWith("T")) {
    speechOutput = this.t("TREBLE_WORD")
  } else if (target.startsWith("D")) {
    speechOutput = this.t("DOUBLE_WORD")
  } else if (target.startsWith("B")) {
    speechOutput = this.t("BULL_WORD")+ ", ";
  }
  if (target.startsWith("DB")) {
    speechOutput += " " + this.t("BULL_WORD");
  }
  var targetNum = target.replace( /^\D+/g, ''); // replace all leading non-digits with nothing
  // console.log("DEBUG: targetNum = " + targetNum.toString());
  if (targetNum.length > 0) { //add trailing number if exists
    speechOutput += " " + parseInt(targetNum).toString() + ", ";
  }
  return speechOutput;
}

function handleUserScore() {
    console.log("DEBUG: keys= " + Object.keys(this.attributes));

    var speechOutput = "";
    var repromptSpeech = "";
    if (isScoreSlotValid(this.event.request.intent)) {
      var scores = this.attributes['scores'];
      var newScore = parseInt(this.event.request.intent.slots.RoundScore.value);
      if (isScoreAboveDarts.call(this, newScore)) {
        scores.push(newScore);
        this.attributes['dartScores'] = []; //remove all dart scores
        var speeches = scoreSpeech.call(this);
        speechOutput = speeches.speechOutput;
        repromptSpeech = speeches.repromptSpeech;
      } else {
        speechOutput = this.t("SCORE_TOO_LOW_MESSAGE");
      }
    } else {
      speechOutput = this.t("BAD_SCORE");
    }
    if (repromptSpeech == "") {
      this.emit(":tellWithCard", speechOutput, this.t("GAME_NAME"), speechOutput);
    } else {
      this.emit(":askWithCard", speechOutput, repromptSpeech, this.t("GAME_NAME"), speechOutput);
    }
}

function handleUserDartScore() {
  var speechOutput = "";
  var repromptSpeech = "";
  if (isDartScoreSlotValid(this.event.request.intent)) {
    addDartScore.call(this);
    var speeches = scoreSpeech.call(this);
    speechOutput = speeches.speechOutput;
    repromptSpeech = speeches.repromptSpeech;
  } else {
    speechOutput = this.t("BAD_DART_SCORE_MESSAGE");
  };
  //always ask with dart score to be ready for next dart
  this.emit(":askWithCard", speechOutput, repromptSpeech, this.t("GAME_NAME"), speechOutput);
}

function addDartScore() {
  var dartScores = this.attributes['dartScores'];
  var newDartScore = dartIntentToScore.call(this);
  if (dartScores.length == 2) { //on third dart create round score
    var totalScore = dartScores[0] + dartScores[1] + newDartScore;
    this.attributes['scores'].push(totalScore);
    this.attributes['dartScores'] = [];
  } else {
    dartScores.push(newDartScore);
  }
}
//convert multipliers to value such as 'double ten' = 20
function dartIntentToScore() {
  var newDartScore = parseInt(this.event.request.intent.slots.DartScore.value);
  if (isDartMultiplierSlotValid(this.event.request.intent)) {
    var multiplier = this.event.request.intent.slots.Multiplier.value;
    console.log("DEBUG: multiplier= " +multiplier);
    if (multiplier == "double") {
      newDartScore = newDartScore + newDartScore;
    } else if (multiplier == "triple") {
      newDartScore = newDartScore + newDartScore + newDartScore;
    }
  }
  return newDartScore;
}

// Handle new dart or round score
function scoreSpeech() {
  var speechOutput = "";
  var repromptSpeech = "";
  var scores = this.attributes['scores'];
  var dartScores = this.attributes['dartScores'];
  var remaining = remainingValue.call(this);
  if (remaining < 0 || remaining == 1) { //Bust
    if (dartScores.length > 0) {
      scores.push(0); //add a bust round score
      this.attributes['dartScores'] = []; //remove all dart scores
    } else {
      scores[scores.length-1] = 0; //convert bust round score to zero
    }
    remaining = remainingValue.call(this); //re-calc remaining
    speechOutput = this.t("BUST_MESSAGE", remainingToDouble.call(this, remaining));
  } else if (remaining == 0) { //the game has been won
    if (dartScores.length > 0) {
      var totalDartScore = dartScores.reduce(function(a, b) { return a + b; });
      scores.push(totalDartScore); //add the darts to the round
      this.attributes['dartScores'] = []; //remove all dart scores
    }
    this.handler.state = GAME_STATES.WON;
    this.attributes['gamesPlayed'] += 1;
    speechOutput = gameWonSpeech.call(this);
  } else if (remaining <= BEST_OUT_LIMIT) {
    var speeches = bestOutSpeech.call(this);
    speechOutput = speeches.speechOutput;
    repromptSpeech = speeches.repromptSpeech;
  } else {
    speechOutput = this.t("REMAINDER_MESSAGE", remaining.toString());
  }
  this.attributes['scores'] = scores;
  return {
    speechOutput: speechOutput,
    repromptSpeech: repromptSpeech
  };
}


function gameWonSpeech() {
  var stats = statistics.call(this);
  return this.t("WON_MESSAGE", stats.numRounds.toString(), stats.ppdScore.toString());
}

function remainderSpeech() {
  var remaining = remainingValue.call(this);
  return this.t("REMAINDER_MESSAGE", remainingToDouble.call(this, remaining));
}

//convert remaining value to a string as a double if possible
function remainingToDouble(remaining) {
  var speechOutput = "";
  if (isEven(remaining) && remaining <= 40) {
    var doubleRemStr = (remaining/2).toString();
    speechOutput = this.t("DOUBLE_WORD") + doubleRemStr;
  } else {
    speechOutput = remaining.toString();
  }
  if (remaining == 50) { //special case double bull
    speechOutput = this.t("DOUBLE_WORD") + " " + this.t("BULL_WORD")
  }
  return speechOutput;
}

function lastScoreSpeech() {
  var scores = this.attributes['scores'];
  var speechOutput = "";
  if (scores.length > 0) {
      speechOutput = this.t("LAST_SCORE_MESSAGE", scores[scores.length-1].toString());
  } else {
      speechOutput = this.t("NO_LAST_SCORE_MESSAGE");
  }
  return speechOutput;
}

function handleStatistics() {
  var scores = this.attributes['scores'];
  var remaining = remainingValue.call(this);

    var speechOutput = "";
    var stats = statistics.call(this);

    if (scores.length == 0) {
      speechOutput = this.t("NO_LAST_SCORE_MESSAGE");
    } else if (scores.length == 1) {
      speechOutput = this.t("SINGLE_STATISTICS_MESSAGE", scores[scores.length-1].toString(),stats.remaining.toString());
    } else if (remaining == 0) {
      speechOutput = this.t("WON_STATISTICS_MESSAGE", stats.numRounds.toString(),stats.maxScore.toString(),stats.minScore.toString(),stats.ppdScore.toString());
    } else {
      speechOutput = this.t("STATISTICS_MESSAGE", stats.numRounds.toString(),stats.remaining.toString(),stats.maxScore.toString(),stats.minScore.toString(),stats.ppdScore.toString());
    }
    this.emit(":askWithCard", speechOutput, speechOutput, this.t("GAME_NAME"), speechOutput);
}
//test if the round score is at least the round darts so far
function isScoreAboveDarts(score) {
  var dartsTotal = 0;
  var dartScores = this.attributes['dartScores'];
  if (dartScores.length > 0) {
    dartsTotal = dartScores.reduce(function(a, b) { return a + b; });
  }
  return score >= dartsTotal;

}
//make sure the round score is a number from 0 to 180
function isScoreSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.RoundScore && intent.slots.RoundScore.value;
    var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.RoundScore.value));
    return answerSlotIsInt && parseInt(intent.slots.RoundScore.value) <= 180 && parseInt(intent.slots.RoundScore.value) >= 0;
}
//make sure the dart score is a number from 0 to 60
function isDartScoreSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.DartScore && intent.slots.DartScore.value;
    var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.DartScore.value));
    return answerSlotIsInt && parseInt(intent.slots.DartScore.value) <= 60 && parseInt(intent.slots.DartScore.value) >= 0;
}

//check if dart multiplier is double or triple
function isDartMultiplierSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.Multiplier && intent.slots.Multiplier.value;
    return answerSlotFilled && (intent.slots.Multiplier.value == "double" || intent.slots.Multiplier.value == "triple")
}

//make sure the start score is a number between 101 and 1001
function isStartScoreSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.StartScore && intent.slots.StartScore.value;
    var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.StartScore.value));
    return answerSlotIsInt && parseInt(intent.slots.StartScore.value) <= 1001 && parseInt(intent.slots.StartScore.value) >= 101;
}

//Calculate the sum of all scores and dart scores and subtract from the game total
function remainingValue() {
  var scores = this.attributes['scores'];
  var dartScores = this.attributes['dartScores'];
  var totalScore = 0;

  if (scores.length > 0) {
    totalScore = scores.reduce(function(a, b) { return a + b; });
  }
  if (dartScores.length > 0) {
    totalScore += dartScores.reduce(function(a, b) { return a + b; });
  }
  console.log("DEBUG: scores= " + scores.toString() + "dartScores= " + dartScores.toString() + " startScore= " + this.attributes['startScore'].toString());
  return this.attributes['startScore'] - totalScore;
}

function statistics() {
  var scores = this.attributes['scores'];
  var numRounds = scores.length;
  var totalScore = 0;
  var  avgScore = 0;
  if (scores.length > 0) {
    totalScore = scores.reduce(function(a, b) { return a + b; });
    avgScore = totalScore / scores.length;
  }
  var minScore = Math.min.apply(null, scores);
  var maxScore = Math.max.apply(null, scores);
  return {
    numRounds: numRounds,
    totalScore: totalScore,
    remaining: this.attributes['startScore'] - totalScore,
    ppdScore: Math.round(avgScore/3), // Points Per Dart
    minScore: minScore,
    maxScore: maxScore
  }
}
