
SimCapi
--------

SimCapi is an interface used by simulations to communicate between AELP (Smart Sparrow's Adaptive eLearning Platform) and the Simulation (Sim).


## Why? ##

Educators and Learning Designers are generally looking to do two things with a sim;
1. Set it up in a specific way for a specific question (eg. disable certain controls or pre-fill certain fields), and
2. Determine what the student has done in the sim so they can provide appropriate feedback.

SimCapi allows you to make both these things happen. In other words, by including SimCapi in your simulation, you can allow AELP (and therefore the teacher) to control the sim.


## How? ##

The first half of SimCapi is the `CapiModel`. You can create variables on this data object which notify other objects whenever they've been changed.

The second half of SimCapi is the `CapiAdapter`, which is responsible for exposing variables on a `CapiModel` to AELP.

Together, a connection is created between AELP and the model where the variables are keep in sync.

In this way, a teacher can set an initial condition via AELP which will be sent through to the simulation. On the flip side, when a student uses the sim, the sim can report changes back to the AELP.


## Backbone ##

For those who use Backbone.js. It's possible to use Backbone Models instead of CapiModels. SimCapi also supplies a `BackboneAdapter`.


## Installation ##

AMD compatible or use the following script tag:

```
<script src='https://lib.smartsparrow.com/simcapi-js-3.0.6.min.js'></script>
```


## How to setup ##

There are three phases to setup SimCapi, _setup data_, _expose data_ and _finalise setup_.


### Setup Data ###

In the setup data phase, you just have to create a `CapiModel`.

For example:

```
var simModel = new simcapi.CapiAdapter.CapiModel({
    demoMode: true,
    studentResponse: '5',
    simEnabled: true
});
```

This `CapiModel` has two variables inside it that can be exposed to AELP.

### Expose Data ###

In this phase, you must tell the `CapiAdapter` what you want to expose from the `CapiModel`.

```
simcapi.CapiAdapter.expose(variableName, model, options);
```

Here is the list of what you must pass to _expose_.

* variableName - String    - name of the variable on the model
* model        - CapiModel - the model that the variable belongs to.
* options      - Object
  * type       - SimCapiValue.TYPES  - the type of the variable. By default, simcapi will detect the type of the variable.
  * alias      - String              - nickname of the variable that is only shown via AELP. Having '.' in the nickname will group variables that have the same prefix.
  * readonly   - Boolean             - if the variable is read-only
  * writeonly  - Boolean             - if the variable is write-only


Inversely, if you want to unexpose your data, you can tell the `CapiAdapter`.

```
simcapi.CapiAdapter.unexpose(variableName, model);
```

Here is the list of what you must pass to _unexpose_.

* variableName - String    - name of the variable on the model
* model        - CapiModel - the model that the variable belongs to.


### Finalise Setup ###

This phase require you to tell SimCapi you have finished setting up the `Capimodel`. This is with the command below:


```
simcapi.Transporter.notifyOnReady();
```

This must be called when the model has finished being setup. It is to tell SimCapi that the `CapiModel` is ready to sync with the AELP. If this is not called, AELP will not sync to the `CapiModel` because it thinks the `CapiModel` is not ready.


## Usage ##

### Transporter ###

Apart from syncing, there may be other functionality that can be used via the `Transporter`.

To be notified when the initial Capi snapshot has been applied, use `addInitialSetupCompleteListener` with a callback function. This must be set before `notifyOnReady` is called.


```
simcapi.Transporter.addInitialSetupCompleteListener(function() {
    //Do something after initial snapshot is available
});
```

#### Check events ####

Sims can have the ability to trigger `check` events the same way when a student clicks on the `check` button on AELP.

```
simcapi.Transporter.triggerCheck();
```

The above code will click `check` on behave of the user when they interact with a sim in a certain way.

It is also possible to pass a callback function to the `triggerCheck` that will be executed when the feedback panel is closed.

```
simcapi.Transporter.triggerCheck({
    complete: function(){
        //Do something when feedback panel is closed.
    }
});
```

Check events can also be trigger external to your sim, and you can respond to these by using `addCheckStartListener` and `addCheckCompleteListener`

```
simcapi.Transporter.addCheckStartListener(function() {
	//Do something when Check event starts
});
simcapi.Transporter.addCheckCompleteListener(function() {
	//Do something when Check event ends
});
```

#### Persisting data ####

There is also the ability to persist student's data between lessons, by using `setDataRequest`

```
function onSuccess(response) {
    var key = response.key
    var value = response.value
    //Do something when data is successfully stored
}

function onError(error) {
    //Do something when request fails
}

var simId = 'yourSim';
var key = 'some data key';
var value = 'data you want to store';

simcapi.Transporter.setDataRequest(simId, key, value, onSuccess, onError);
```


To retrieve the stored data, use `getDataRequest`. If you are polling for data changes, please be aware of how many users will be using your sim when setting your polling duration.

```
function onSuccess(response) {
    var keyExists = response.exists;
    var key = response.key
    var value = response.value
    //Do something
}

function onError(error) {
    //Do something when request fails
}

var simId = 'yourSim';
var key = 'some data key';

simcapi.Transporter.getDataRequest(simId, key, onSuccess, onError);
```

### Sim Context ###
Sims may run in different contexts, such as a when when an instructor is configuring the sim, as to when a student is viewing the sim.  A sim can discern its context by the property `simcapi.Transporter.getConfig().context`, where the value will be one of:
* VIEWER, sim is either being used by the student or previewed by an instructor
* AUTHOR, sim is being used by the instructor in an authoring environment
* REPORT, sim is being used to report previous input from a student


### A simple example ###
```
var simModel = new simcapi.CapiAdapter.CapiModel({
    demoMode: true,
    studentResponse: '5',
    simEnabled: true
});

...

simcapi.CapiAdapter.expose('demoMode', simModel,
                                     {readonly: false});
simcapi.CapiAdapter.expose('studentResponse', simModel,
                                            {alias: 'studentAnswer',
                                           readonly: true});
simcapi.CapiAdapter.expose('simEnabled', simModel,
                                       {writeonly: true});

...

simcapi.Transporter.notifyOnReady();
```


For SimCapi to work, you must use the following functions on the `CapiModel`:


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
    studentResponse: '5',
    simEnabled: true
  }
});


var simModel = new SimModel();

...

simcapi.BackboneAdapter.expose('demoMode', simModel,
                                              {readonly: false});
simcapi.BackboneAdapter.expose('studentResponse', simModel,
                                               {alias: 'studentAnswer',
                                                readonly: true});
simcapi.CapiAdapter.expose('simEnabled', simModel,
                                       {writeonly: true});

...

simcapi.Transporter.notifyOnReady();
```

### AllowedValues ###

It's possible for SimCapi to supply the teacher with a choice of options for a particular property on a sim if it is possible.

For example, you have a capi property named _color_ and depending whether the teacher inputs the strings 'red', 'blue', or 'green',
the background will change to that color.

Getting the teacher to type up the color may cause issues like spelling mistakes or the teacher not knowing what the valid values are.

#### Simple Example ####

```

var simModel = new simcapi.CapiAdapter.CapiModel({
    color: 'red'
});

simcapi.CapiAdapter.expose('color', simModel, {allowedValues: ['red', 'blue', 'green']});

...

simcapi.Transporter.notifyOnReady();

```

Note that using this will always return a string, even if you say the allowed values to be numbers.


### Dynamic Capi ###

It is possible to expose more capi properties depending on a change of another capi property.

For example, you have a capi property named _numberOfColors_. For each color, you want more capi properties to appear for _name_ and _red_, _green_ and _blue_ properties. So 4 capi properties will be exposed for the numberOfColors that the teacher sets.


#### Simple Example ####

```

var simModel = new simcapi.CapiAdapter.CapiModel({
    numberOfColors: 0
});

simcapi.CapiAdapter.expose('numberOfColors', simModel);

simModel.on('change:numberOfColors', function(m, attributes){
    for(var i = 0; i< attributes.numberOfColors; ++i){
        createProperty('color'+i+'Name', '');
        createProperty('color'+i+'Red', 0);
        createProperty('color'+i+'Green', 0);
        createProperty('color'+i+'Blue', 0);
    }
});

function createProperty(name, defaultValue){
    simModel.set(name, defaultValue);
    simcapi.CapiAdapter.expose(name, simModel);
}

...

simcapi.Transporter.notifyOnReady();

```

Take note that when numberOfColors change, we create the variables on the model and expose those values via Simcapi.
