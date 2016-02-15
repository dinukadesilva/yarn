/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint quotes: 0 */

import ProgressBar from "../../src/reporters/console/progress-bar.js";
import Spinner from "../../src/reporters/console/spinner.js";
import ConsoleReporter from "../../src/reporters/console/index.js";
import { wait } from "../../src/util/promise.js";
import build from "./_build.js";

let test = require("ava");

let getConsoleBuff = build(ConsoleReporter, (data) => data);

test("ConsoleReporter.step", async (t) => {
  t.same(await getConsoleBuff((r) => r.step(1, 5, "foboar")), {
    stderr: [],
    stdout: ["\u001b[90m[1/5]\u001b[39m foboar..."]
  });
});

test("ConsoleReporter.header", async (t) => {
  t.same(await getConsoleBuff((r) => r.header("foobar")), {
    stderr: [],
    stdout: ["\u001b[1mkpm foobar v0.0.0\u001b[22m"]
  });
});

test("ConsoleReporter.footer", async (t) => {
  t.same(await getConsoleBuff((r) => r.footer()), {
    stderr: [],
    stdout: ["✨  Done in 0.00s. Peak memory usage 0.00MB."]
  });
});

test("ConsoleReporter.log", async (t) => {
  t.same(await getConsoleBuff((r) => r.log("foobar")), {
    stderr: [],
    stdout: ["foobar"]
  });
});

test("ConsoleReporter.success", async (t) => {
  t.same(await getConsoleBuff((r) => r.success("foobar")), {
    stderr: [],
    stdout: ["\u001b[32msuccess\u001b[39m foobar"]
  });
});

test("ConsoleReporter.error", async (t) => {
  t.same(await getConsoleBuff((r) => r.error("foobar")), {
    stderr: ["\u001b[31merror\u001b[39m foobar"],
    stdout: []
  });
});

test("ConsoleReporter.info", async (t) => {
  t.same(await getConsoleBuff((r) => r.info("foobar")), {
    stderr: [],
    stdout: ["\u001b[34minfo\u001b[39m foobar"]
  });
});

test("ConsoleReporter.command", async (t) => {
  t.same(await getConsoleBuff((r) => r.command("foobar")), {
    stderr: [],
    stdout: ["\u001b[90m$ foobar\u001b[39m"]
  });
});

test("ConsoleReporter.warn", async (t) => {
  t.same(await getConsoleBuff((r) => r.warn("foobar")), {
    stderr: ["\u001b[33mwarning\u001b[39m foobar"],
    stdout: []
  });
});

test("ConsoleReporter.activity", async (t) => {
  t.same(await getConsoleBuff(function (r) {
    let activity = r.activity();
    activity.tick("foo");
    activity.end();
  }), {
    stderr: [
      "\u001b[2K",
      "\u001b[1G",
      "⠁",
      "\u001b[2K",
      "\u001b[1G"
    ],
    stdout: []
  });

  t.same(await getConsoleBuff(function (r) {
    let activity = r.activity();
    activity.tick("foo");
    activity.end();
  }), {
    stderr: [],
    stdout: []
  });
});

test("ConsoleReporter.select", async (t) => {
  t.same(await getConsoleBuff(async function (r, streams) {
    streams.stdin.on("resume", function () {
      streams.stdin.send("1\n", "ascii");
      streams.stdin.end();
    });

    let res = await r.select("Ayo", "Select one", ["foo", "bar"]);
    t.same(res, "foo");
  }), {
    stderr: [],
    stdout: [
      "Ayo",
      "1. foo",
      "2. bar",
      "\u001b[1G",
      "\u001b[0J",
      "Select one?:",
      "\u001b[14G",
      "1"
    ]
  });
});

test("ConsoleReporter.progress", async (t) => {
  t.same(await getConsoleBuff(async function (r) {
    let tick = r.progress(2);
    tick();
    await wait(1000);
    tick();
  }), {
    stderr: [
      "\u001b[2K",
      "\u001b[1G",
      "░░ 0/2",
      "\u001b[2K",
      "\u001b[1G",
      "█░ 1/2",
      "\u001b[2K",
      "\u001b[1G",
    ],
    stdout: []
  });

  t.same(await getConsoleBuff(async function (r) {
    let tick = r.progress(0);
    tick();
  }), {
    stderr: [],
    stdout: []
  });

  t.same(await getConsoleBuff(async function (r, streams) {
    streams.stderr.isTTY = streams.stdout.isTTY = false;
    let tick = r.progress(2);
    tick();
    tick();
  }), {
    stderr: [],
    stdout: []
  });
});

test("ProgressBar", (t) => {
  let data = "";

  let bar = new ProgressBar(2, {
    columns: 1000,
    write(msg) {
      data += msg;
    }
  });

  bar.render();
  t.is(data, "\u001b[2K\u001b[1G░░ 0/2");

  bar.tick();
  bar.render();
  t.is(data, "\u001b[2K\u001b[1G░░ 0/2\u001b[2K\u001b[1G█░ 1/2");

  bar.tick();
  bar.render();
  t.is(data, "\u001b[2K\u001b[1G░░ 0/2\u001b[2K\u001b[1G█░ 1/2\u001b[2K\u001b[1G\u001b[2K\u001b[1G██ 2/2");
});

test("Spinner", (t) => {
  let data = "";

  let spinner = new Spinner({
    write(msg) {
      data += msg;
    }
  });

  spinner.start();
  t.is(data, "\u001b[2K\u001b[1G⠁ ");

  spinner.setText("foo");
  spinner.render();
  t.is(data, "\u001b[2K\u001b[1G⠁ \u001b[2K\u001b[1G⠂ foo");

  spinner.setText("bar");
  spinner.render();
  t.is(data, "\u001b[2K\u001b[1G⠁ \u001b[2K\u001b[1G⠂ foo\u001b[2K\u001b[1G⠄ bar");

  spinner.stop();
  t.is(data, "\u001b[2K\u001b[1G⠁ \u001b[2K\u001b[1G⠂ foo\u001b[2K\u001b[1G⠄ bar\u001b[2K\u001b[1G");
});
