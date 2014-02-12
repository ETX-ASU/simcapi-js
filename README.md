Pipit
--------

Pipit is an interface used by simulations to communicate between AELP (Smart Sparrow's Adaptive eLearning Platform) and the Simulation (Sim).


## Why? ##

Teachers are generally looking to do two things with a sim;
1. Set it up in a specific way for a specific question (eg. disable certain controls or pre-fill certain fields), and
2. Determine what the student has done in the sim so they can provide appropriate feedback.

Pipit allows you to make both these things happen. In other words, by including Pipit in your simulation, you can allow AELP (and therefore the teacher) to control the sim.


## How? ##

The first half of pipit is the `CapiModel`. You can create variables on this data object which notify other objects whenever they've been changed.

The second half of Pipit is the `CapiAdapter`, which is responsible for exposing variables on a `CapiModel` to AELP.

Together, a connection is created between AELP and the model where the variables are keep in sync.

In this way, a teacher can set an initial condition via AELP which will be sent through to the simulation. On the flip side, when a student uses the sim, the sim can report changes back to the AELP.


## Backbone ##

For those who use Backbone.js. It's possible to use Backbone Models instead of CapiModels. Pipit also supplies a `BackboneAdapter`.


## Installation ##

AMD compatible or use the following script tag:

```
<script src= "https://d1rpkia8qpfj4t.cloudfront.net/pipit-0.51.min.js"></script>
```


## How to setup ##

There are three phases to setup Pipit, _setup data_, _expose data_ and _finalise setup_.


### Setup Data ###

In the setup data phase, you just have to create a `CapiModel`. 

For example:

```
var simModel = new pipit.CapiAdapter.CapiModel({
    demoMode: true,
    studentResponse: "5"
});
```

This `CapiModel` has two variables inside it that can be exposed to AELP. 

### Expose Data ###

In this phase, you must tell the `CapiAdapter` what you want to expose from the `CapiModel`.

```
pipit.CapiAdapter.expose(variableName, model, options);
```

Here is the list of what you must pass to _expose_.

variableName - String    - name of the variable on the model
model        - CapiModel - the model that the variable belongs to.
options      - Object  
                         - type     - SimCapiValue.TYPES  - the type of the variable. By default, pipit will detect the type of the variable. 
                         - alias    - String              - nickname of the variable that is only shown via AELP. Having '.' in the nickname will group variables that have the same prefix.
                         - readonly - Boolean             - if the variable is readonly 


Inversely, if you want to unexpose your data, you can tell the `CapiAdapter`.

```
pipit.CapiAdapter.unexpose(variableName, model);
```

Here is the list of what you must pass to _unexpose_.

variableName - String    - name of the variable on the model
model        - CapiModel - the model that the variable belongs to.


### Finalise Setup ###

This phase require you to tell Pipit you have finished setting up the `Capimodel`. This is with the command below:


```
pipit.Controller.notifyOnReady();
```

This must be called when the model has finished being setup. It is to tell Pipit that the `CapiModel` is ready to sync with the AELP. If this is not called, AELP will not sync to the `CapiModel` because it thinks the `CapiModel` is not ready.



## Usage ##

### Controller ###

Apart from syncing, there may be other functionality that can be used via the `Controller`.

Sims can have the ability to trigger `check` events the same way when a student clicks on the `check` button on AELP. 

```
pipit.Controller.triggerCheck();  
```

The above code will click `check` on behave of the user when they interact with a sim in a certain way.

It is also possible to pass a callback function to the `triggerCheck` that will be executed when the feedback panel is closed.

```
pipit.Controller.triggerCheck({
    complete: function(){
        //Do something when feedback panel is closed.
    }
});
```

### A simple example ###
```
var simModel = new pipit.CapiAdapter.CapiModel({
    demoMode: true,
    studentResponse: "5"
});

...

pipit.CapiAdapter.expose("demoMode", simModel, 
                                    {readonly: false});
pipit.CapiAdapter.expose("studentResponse", simModel, 
                                          {alias: "studentAnswer", 
                                           readonly: true});

...

pipit.Controller.notifyOnReady();
```


For Pipit to work, you must use the following functions on the `CapiModel`:


#### Get ####
  To retrieve a variable from a `CapiModel`.

  For example:

  ```
  var value = simModel.get('demoMode');
  ```

#### Set ####
  To set a variable to the `CapiModel`.

  For example:

  ```
  simModel.set('demoMode', false);
  ```  

#### On ####
  To listen to changes to a variable that were sent from the AELP or changed in the simulation.

  For example:

  ```
  simModel.on('change:demoMode', function(){
    var changedValue = simModel.get('demoMode');
  });
  ```

  That function will be called everytime _demoMode_ changes. 

#### Has ####

  Checks to see if a variable with the given name exists in the `CapiModel`

  ```
  var returnsTrue = simModel.has('demoMode')
  ```



### A backbone example ###

```
var SimModel = Backbone.Model.extend({
  defaults:{
    demoMode: true,
    studentResponse: "5"
  }
});


var simModel = new SimModel();

...

pipit.BackboneAdapter.expose("demoMode", simModel, 
	                                          {readonly: false});
pipit.BackboneAdapter.expose("studentResponse", simModel, 
                                               {alias: "studentAnswer", 
                                                readonly: true});

...

pipit.Controller.notifyOnReady();
```