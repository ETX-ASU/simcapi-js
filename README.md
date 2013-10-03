Sim CAPI
--------

Sim CAPI or Simulation Control API, is an interface used by simulations to communicate between AELP (Smart Sparrow's Adaptive eLearning Platform) and the Simulation (Sim).


Why?
----

Without Sim CAPI, AELP can run the simulation... and that’s about it. This scenario makes any simulation on AELP pretty useless.
With Sim CAPI, the platform can control the Simulation. Simulations by themselves, do not expose information to what is happening inside the sim. So depending on what the Simulation exposes, can AELP control the Simulation.   



Installation
------------

AMD compatible or use the folling script tag:

```
<script src= "https://github.com/smartsparrow/sim-capi-js/bin/sim-capi-min.js">
```

Sim CAPI Types
--------------

Sim CAPI must know what is being exposed and its type. AELP communicates it’s data as strings through to SimCapi, so SimCapi must convert the data to its original type.  
Currently there are 4 types in SimCapi:

- NUMBER
- BOOLEAN
- STRING
- ARRAY


How to use
----------

There are two phases to use Sim CAPI, _setup_ and _setup-completion_.

*+Setup+*

In the setup phase, you must tell Sim CAPI what you want the Sim to expose. This is done with the method _watch_

```
SimCapi.watch(propertyName, options);
```

propertyName - String - name of the property on the model
options      - Object - parent   - Backbone.Model - the model ( not optional)
                        type     - SimCapi.TYPES  - the type of the property (not optional)
                        alias    - String         - nickname of the property that is only shown via AELP
                        readonly - Boolean        - if the property is readonly (not optional)


*+Setup-completion+*

This phase require you to tell Sim CAPI you have finished setting up the model. This is done with the method called _notifyOnReady_.


```
SimCapi.notifyOnReady();
```

This must be called when the model has finished being setup. It is to tell Sim CAPI that the Sim model is ready to recieve messages from AELP. If this is not called, AELP will not send any messages to the Sim because it thinks the Sim is not ready.



Usage
-----

*+A simple example+*

```
var SimModel = Backbone.Model.extend({
  defaults:{
    currentTime: 0,
    selectedObject: ‘saturn’
  }
});



var simModel = new SimModel();

...


SimCapi.watch(‘currentTime’, {parent: simModel, type: SimCapi.TYPES.NUMBER, readonly: true});
SimCapi.watch(‘selectedObject’, {parent: simModel, 
                alias: “selectedPlanet”, 
                type: SimCapi.TYPES.STRING, 
                readonly: false});

…

SimCapi.notifyOnReady();
```