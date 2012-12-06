How to use the simcapi
----------------------

1. Include simcapi.js
2. Include a javascript block that require eventBus, SharedSimCapi and SimCapiHandler.
3. Initialize SharedSimCapi with the global data (lessonId, authToken, etc.)
4. Initialize SimCapiHandler

Example code:

```
<!DOCTYPE html>
<html lang="en">
  <head>

    ...

    <!-- Step 1 -->
    <script src="path/to/simcapi.js"></script>
    <!-- Step 2 -->
    <script type="text/javascript">
      require(["jquery", "eventBus", "api/snapshot/SharedSimData", "api/snapshot/SimCapiHandler"],
          function($, eventBus, SharedSimData, SimCapiHandler) {
        // Step 3
        SharedSimData.getInstance();
        eventBus.trigger('simData:authToken', theAuthToken);
        eventBus.trigger('simData:lessonId', theLessonId);

        // Step 4
        var simCapiHandler = new SimCapiHandler({ $container: $("body") });
      });
    </script>
  </head>
  <body>
    <iframe id="sim" src='path/to/sim.html'></iframe>
  </body>
</html>

```