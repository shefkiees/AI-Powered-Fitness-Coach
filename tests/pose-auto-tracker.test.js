/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createAutoWorkoutTracker } = require("../lib/pose/autoWorkoutTracker.js");

const frame = { width: 640, height: 480 };

function blankPose() {
  return Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0 }));
}

function point(x, y, score = 0.9) {
  return { x, y, score };
}

function squatPose(phase) {
  const pose = blankPose();
  pose[0] = point(320, 70);
  pose[5] = point(280, 130);
  pose[6] = point(360, 130);
  pose[7] = point(270, 205);
  pose[8] = point(370, 205);
  pose[9] = point(265, 270);
  pose[10] = point(375, 270);

  if (phase === "bottom") {
    pose[11] = point(280, 315);
    pose[12] = point(360, 315);
    pose[13] = point(255, 355);
    pose[14] = point(385, 355);
    pose[15] = point(300, 430);
    pose[16] = point(340, 430);
  } else {
    pose[11] = point(285, 250);
    pose[12] = point(355, 250);
    pose[13] = point(285, 350);
    pose[14] = point(355, 350);
    pose[15] = point(285, 440);
    pose[16] = point(355, 440);
  }

  return pose;
}

function jumpingJackPose(phase) {
  const pose = blankPose();
  pose[0] = point(320, 70);
  pose[5] = point(280, 135);
  pose[6] = point(360, 135);
  pose[11] = point(292, 250);
  pose[12] = point(348, 250);
  pose[13] = point(300, 340);
  pose[14] = point(340, 340);

  if (phase === "open") {
    pose[7] = point(250, 95);
    pose[8] = point(390, 95);
    pose[9] = point(235, 55);
    pose[10] = point(405, 55);
    pose[15] = point(225, 430);
    pose[16] = point(415, 430);
  } else {
    pose[7] = point(270, 210);
    pose[8] = point(370, 210);
    pose[9] = point(292, 295);
    pose[10] = point(348, 295);
    pose[15] = point(300, 430);
    pose[16] = point(340, 430);
  }

  return pose;
}

function bicepsCurlPose(phase) {
  const pose = blankPose();
  pose[0] = point(320, 70);
  pose[5] = point(270, 135);
  pose[6] = point(370, 135);
  pose[11] = point(285, 285);
  pose[12] = point(355, 285);
  pose[13] = point(285, 360);
  pose[14] = point(355, 360);
  pose[15] = point(285, 440);
  pose[16] = point(355, 440);
  pose[7] = point(270, 215);
  pose[8] = point(370, 215);

  if (phase === "top") {
    pose[9] = point(298, 155);
    pose[10] = point(342, 155);
  } else {
    pose[9] = point(270, 305);
    pose[10] = point(370, 305);
  }

  return pose;
}

function feedPhase(tracker, pose, timestamp, frames = 3, stepMs = 220) {
  let state = null;
  let time = timestamp;
  for (let index = 0; index < frames; index += 1) {
    time += stepMs;
    state = tracker.update(pose, frame, time);
  }
  return { state, timestamp: time };
}

test("auto tracker detects squats and counts only completed stand-bottom-stand reps", () => {
  const tracker = createAutoWorkoutTracker();
  let timestamp = 1000;
  let result;

  result = feedPhase(tracker, squatPose("standing"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("bottom"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("standing"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("bottom"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("standing"), timestamp, 4);

  assert.equal(result.state.detectedExercise, "squat");
  assert.equal(result.state.totals.squat.reps, 1);
  assert.equal(result.state.totalReps, 1);
});

test("auto tracker detects bicep curls from elbow motion without manual selection", () => {
  const tracker = createAutoWorkoutTracker();
  let timestamp = 5000;
  let result;

  result = feedPhase(tracker, bicepsCurlPose("down"), timestamp, 3, 180);
  timestamp = result.timestamp;
  result = feedPhase(tracker, bicepsCurlPose("top"), timestamp, 3, 180);
  timestamp = result.timestamp;
  result = feedPhase(tracker, bicepsCurlPose("down"), timestamp, 4, 180);
  timestamp = result.timestamp;
  result = feedPhase(tracker, bicepsCurlPose("top"), timestamp, 3, 180);
  timestamp = result.timestamp;
  result = feedPhase(tracker, bicepsCurlPose("down"), timestamp, 4, 180);

  assert.equal(result.state.detectedExercise, "biceps_curl");
  assert.equal(result.state.totals.biceps_curl.reps, 1);
  assert.match(result.state.coachCues[0], /Bicep curl/i);
});

test("auto tracker does not count jitter when a squat never returns to standing", () => {
  const tracker = createAutoWorkoutTracker();
  let timestamp = 2000;
  let result = feedPhase(tracker, squatPose("standing"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("bottom"), timestamp, 8);

  assert.equal(result.state.totals.squat.reps, 0);
  assert.equal(result.state.totalReps, 0);
});

test("auto tracker smooths over a brief dropped frame instead of instantly losing the body", () => {
  const tracker = createAutoWorkoutTracker();
  let timestamp = 3000;
  let result = feedPhase(tracker, squatPose("standing"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("bottom"), timestamp);
  timestamp = result.timestamp;
  result = feedPhase(tracker, squatPose("standing"), timestamp);

  const dropped = tracker.update([], frame, result.timestamp + 200);

  assert.equal(dropped.detectedExercise, "squat");
  assert.equal(dropped.trackingStable, false);
  assert.match(dropped.headline, /dropout/i);
});

test("auto tracker detects jumping jacks and counts closed-open-closed cycles", () => {
  const tracker = createAutoWorkoutTracker();
  let timestamp = 4000;
  let result;

  result = feedPhase(tracker, jumpingJackPose("closed"), timestamp, 3, 140);
  timestamp = result.timestamp;
  result = feedPhase(tracker, jumpingJackPose("open"), timestamp, 3, 140);
  timestamp = result.timestamp;
  result = feedPhase(tracker, jumpingJackPose("closed"), timestamp, 4, 140);
  timestamp = result.timestamp;
  result = feedPhase(tracker, jumpingJackPose("open"), timestamp, 3, 140);
  timestamp = result.timestamp;
  result = feedPhase(tracker, jumpingJackPose("closed"), timestamp, 4, 140);

  assert.equal(result.state.detectedExercise, "jumping_jack");
  assert.equal(result.state.totals.jumping_jack.reps, 1);
});
