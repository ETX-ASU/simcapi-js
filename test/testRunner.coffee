#!/usr/local/bin/phantomjs

fs = require 'fs'

# Runs a Jasmine Suite from an html page
# @page is a PhantomJs page object
# @exit_func is the function to call in order to exit the script

class PhantomJasmineRunner
  constructor: (@page, @exit_func = phantom.exit) ->
    @tries = 0
    @max_tries = 10

  # consoleReporter MUST BE a global variable
  get_status: -> @page.evaluate(-> consoleReporter.failedCount)

  terminate: ->
    switch @get_status()
      when 0 then @exit_func 0
      else        @exit_func 1

# Script Begin
if phantom.args.length == 0
  console.log "Need a url as the argument"
  phantom.exit 1

address = 'file:///' + fs.workingDirectory + '/' + phantom.args[0]
console.log 'address: ' + address

page = new WebPage()

runner = new PhantomJasmineRunner(page)

# Don't suppress console output
page.onConsoleMessage = (msg) ->
  console.log msg

  if msg.indexOf('test-case') == 0
    testCase = JSON.parse(msg.substring(11))
    fs.write(testCase.filename, testCase.text, 'w')

  # Terminate when the reporter singals that testing is over.
  # We cannot use a callback function for this (because page.evaluate is sandboxed),
  # so we have to *observe* the website.
  if msg == "JUnitReporter finished"
    runner.terminate()

address = phantom.args[0]

page.open address, (status) ->
  if status != "success"
    console.log "can't load the address!"
    phantom.exit 1

  # Now we wait until onConsoleMessage reads the termination signal from the log.