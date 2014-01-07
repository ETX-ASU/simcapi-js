Pipit
--------

Pipit is an interface used by simulations to communicate between AELP (Smart Sparrow's Adaptive eLearning Platform) and the Simulation (Sim).


## Why? ##

Without Pipit, AELP can run the simulation... and that’s about it. This scenario makes any simulation on AELP pretty useless.
With Pipit, the platform can control the Simulation. Simulations by themselves, do not expose information to what is happening inside the sim. So depending on what the Simulation exposes, can AELP control the Simulation.   



## Installation ##

AMD compatible or use the following script tag:

```
<script src= "https://github.com/SmartSparrow/pipit/dist/pipit.min.js">
```


## How to use ##

There are two phases to use Pipit, _setup_ and _setup-completion_.

To use Pipit, you must use an `adapter` to be able to interface with AELP. There exists two Adapters, `CapiAdapter` and `BackboneAdapter`. 

### Setup ###

In the setup phase, you must tell Pipit what you want the Sim to expose. To expose the properties of the simulation, you use the method _watch_.

```
pipit.CapiAdapter.watch(propertyName, model, options);
```

propertyName - String - name of the property on the model
model        - Object - the model that the property belongs to.
options      - Object  
                       - type     - SimCapiValue.TYPES  - the type of the property 
                       - alias    - String              - nickname of the property that is only shown via AELP. Can __NOT__ contain '.'
                       - readonly - Boolean             - if the property is readonly 


### Setup-completion ###

This phase require you to tell Pipit you have finished setting up the model. This is with the command below:


```
pipit.Controller.notifyOnReady();
```

This must be called when the model has finished being setup. It is to tell Pipit that the Sim model is ready to recieve messages from AELP. If this is not called, AELP will not send any messages to the Sim because it thinks the Sim is not ready.



## Usage ##

### A simple example ###
```
var simModel = new pipit.CapiAdapter.CapiModel({
    currentTime: 0,
    selectedObject: ‘saturn’
});

...

pipit.CapiAdapter.watch(‘currentTime’, simModel, 
                                       {readonly: true});
pipit.CapiAdapter.watch(‘selectedObject’, simModel, 
                                          {alias: “selectedPlanet”, 
                                           readonly: false});

…

pipit.Controller.notifyOnReady();
```



### A backbone example ###

```
var SimModel = Backbone.Model.extend({
  defaults:{
    currentTime: 0,
    selectedObject: ‘saturn’
  }
});



var simModel = new SimModel();

...

pipit.BackboneAdapter.watch(‘currentTime’, simModel, 
	                                          {readonly: true});
pipit.BackboneAdapter.watch(‘selectedObject’, simModel, 
                                               {alias: “selectedPlanet”, 
                                                readonly: false});

…

pipit.Controller.notifyOnReady();
```