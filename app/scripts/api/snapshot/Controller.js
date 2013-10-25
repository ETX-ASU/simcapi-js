define(['api/snapshot/Transporter'], function(Transporter){

	return {notifyOnReady: Transporter.getInstance().notifyOnReady};

});