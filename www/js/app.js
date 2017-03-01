/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
liberacion = true;

 var utiles = {
    
    alerta: function(params) {
        titulo = params.titulo;
        mensaje = params.mensaje;
        btnOk = params.btnOk;
        
        configFancy = {
            padding:0,
            fitToView:false,
            wrapCSS : 'alertaSitio',
            autoCenter: false,
            closeEffect: 'none',
            closeSpeed:0,
            closeBtn:false,
            helpers: {
                    overlay: { closeClick: false,locked: true } //Disable click outside event
            }
        }
        if (params.close)
            configFancy.afterClose = params.close;

        $contenedorAlerta = $(document.createElement('div')).addClass('alertaCont');
        $titulo = $(document.createElement('div')).addClass('titulo').html(titulo);
        $textoMensaje = $(document.createElement('div')).addClass('textoMensaje').html(mensaje);
        $accionesConfirm = $(document.createElement('div')).addClass('accionesConfirmLayer');
        
        if(btnOk!=false){
            $boton = $(document.createElement('a')).addClass('cierreFancy').text(btnOk).attr('href','#');
            $accionesConfirm.append($boton);
        }
        
        if(params.preload){
            $imgLoader = $(document.createElement('img')).addClass('preloader').attr('src','img/loading_update.gif');
            $accionesConfirm.append($imgLoader);
        }
        
        $contenedorAlerta
                .append($titulo)
                .append($textoMensaje)
                .append($accionesConfirm);
        
        configFancy.content = $contenedorAlerta;
        
        $.fancybox(configFancy);
    },
    addContactSuccess : function (contact) {
        
        utiles.alerta({
                        titulo:'Éxito',
                        mensaje:'El contacto se ha agregado correctamente',
                        btnOk:"Cerrar"
                    });

    },
    addContactError : function (contactError) {

        utiles.alerta({
                        titulo:'Error',
                        mensaje:'No se pudo guardar el contacto ('+contactError.code+')',
                        btnOk:"Cerrar"
                    });
    }

};

var source = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
if ( source ) {
    // PhoneGap application
    source_route = (!liberacion)?'http://starmedica.codice.com/':'https://www.starmedica.com/';
    sitioapp = source_route+'app/home/app';
} else {
    // Web page
    source_route = 'http://localhost:81/StarMedica/';
    sitioapp = source_route+'movil/home/app';
}
ios = false;
if( (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i)) )
    ios = true;

intentos = 0,
internetIntentos=0,
linkIntentos=0;


var app = {
    version: 0,
    servicio : source_route+'webapp_service/index.php',
    urlsitio : sitioapp,
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady(), false);
        document.addEventListener('online', app.checkConnection('online'), false);
        //document.addEventListener("offline", app.checkConnection('offline'), false);
        document.addEventListener("backbutton", onBackKeyDown(), false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    checkConnection: function(caller){
        
        if(caller == 'offline') 
        {
            console.log('Se cayó la red');
        }
        else
        {
            
            console.log('Caller:' + caller);
            
            connectionState = {};
            
            var xhr = new XMLHttpRequest();
            var file = app.servicio;
            var r = Math.round(Math.random() * 10000);
            xhr.open('HEAD', file + "?subins=" + r, false);
            try {
                xhr.send();
                if (xhr.status >= 200 && xhr.status < 304) {
                    connectionState = {tipo:-1,lbl:'Conexión desconocida'};
                } else {
                    connectionState = {tipo:0,lbl:'Verifique su conexión a internet por favor!'};
                }
            } catch (e) {
                connectionState = {tipo:0,lbl:'Verifique su conexión a internet por favor!'};
            }
         
            retorno = connectionState;
            
            
            //return states[networkState];
            return retorno;
        }
    },
    onDeviceReady: function() {


        var version = JSON.parse(localStorage.getItem('version'));

        if(version==null){

            localStorage.setItem('version', app.version);
            app.version = JSON.parse(localStorage.getItem('version'));

        } else {

            app.version = version;

        }

        var cssLocal = JSON.parse(localStorage.getItem('cssLocal'));
        var jsLocal = JSON.parse(localStorage.getItem('jsLocal'));

        if(cssLocal!=null)
            $('#injectedCSS').html(cssLocal);
        if(jsLocal!=null)
            $('#injectedJS').html(jsLocal);



        internet = app.checkConnection('onDeviceReady');

        if (internet.tipo!=0) 
            app.checkForUpdates();
        else 
        {
            utiles.alerta(
                        {
                            titulo:'Conexión',
                            mensaje:internet.lbl,
                            btnOk:(intentos<2)?"Reintentar":'Cerrar',
                            close:function(){

                                    if(internetIntentos < 3)
                                        setTimeout(function(){app.onDeviceReady();},1000);
                                    else
                                        navigator.app.exitApp();

                                    internetIntentos++;

                                }
                        }
                    )

        }

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    checkForUpdates: function(callback){
        utiles.alerta({
                    titulo:'Actualizaciones',
                    mensaje:'Revisando actualizaciones',
                    btnOk:false,
                    preload:true
                    });
        //Codigo para validar si hay estilos, js, recursos y demás por inyectar
        $.ajax({
            url: app.servicio+'?act=getVersion',
            dataType: 'JSON',
            success: function(data, status) {
                console.log(data);
                if(data.codigo==1){
                    //validar data.version contra la version local, si es diferente inyectar lo correspondiente
                    if(app.version != data.version)
                        setTimeout(function(){$.fancybox.close();app.actualizarApp();},1000);
                    else
                        setTimeout(function(){$.fancybox.close();app.toMain();},1000);

                } else {
                    utiles.alerta({
                                    titulo:'Error',
                                    mensaje:'Ocurrió un error, favor de volver a intentar (01)<br>'+data.codigo,
                                    btnOk:"Ok"
                                });
                }

            },
            error: function() {
                //handle the error
                utiles.alerta({
                                titulo:'Error',
                                mensaje:'Ocurrió un error en la comunicación, favor de volver a intentar (02)',
                                btnOk:(intentos<3)?"Ok":'Cerrar',
                                close:function(){

                                    if(intentos < 3)
                                        setTimeout(function(){app.checkForUpdates();},1000);
                                    else
                                        navigator.app.exitApp();

                                    intentos++;
                                }
                            });
            }
        });
    },
    actualizarApp: function(){
        utiles.alerta({
                    titulo:'Actualizando',
                    mensaje:'Actualizando contenido',
                    btnOk:false,
                    preload:true
                    });
        //Codigo para validar si hay estilos, js, recursos y demás por inyectar
        $.ajax({
            url: app.servicio+'?act=getChanges',
            dataType: 'JSON',
            success: function(data, status) {
                if(data.codigo==1){
                    console.log(data);
                    if(data.css){
                        $('#injectedCSS').html(data.css);
                        localStorage.setItem('cssLocal', JSON.stringify(data.css));
                    }
                    if(data.js){
                        $('#injectedJS').html(data.js);
                        localStorage.setItem('jsLocal', JSON.stringify(data.js));
                    }

                    if(data.css == $('#injectedCSS').text() && data.js == $('#injectedJS').text()){
                        localStorage.setItem('version', data.version);
                        setTimeout(function(){
                            $.fancybox.close();
                            utiles.alerta({
                                    titulo:'Actualizado',
                                    mensaje:data.mensaje,
                                    btnOk:"Ok",
                                    close: function(){app.toMain();}
                                });
                        },1000);
                    } else {
                        setTimeout(function(){
                            $.fancybox.close();
                            utiles.alerta({
                                    titulo:'Error',
                                    mensaje:'Ha ocurrido un error durante la actualización, favor de reiniciar la aplicación.',
                                    btnOk:"Cerrar",
                                    close: function(){navigator.app.exitApp();}
                                });
                        },1000);
                    }

                } else {
                    utiles.alerta({
                                    titulo:'Error',
                                    mensaje:'Ocurrió un error, favor de volver a intentar<br>'+data.codigo,
                                    btnOk:"Ok"
                                });
                }

            },
            error: function() {
                //handle the error
                utiles.alerta({
                                titulo:'Error',
                                mensaje:'Ocurrió un error en la comunicación, favor de volver a intentar (04)',
                                btnOk:"Ok"
                            });
            }
        });
    },
    toMain: function(){

        $('#mainPage').show();
        $('#contenidoSitio').attr('src',app.urlsitio);
        
                
    },
    validarInteraccion: function(msg){

        if (msg.data.type == "shareProduct" )
        {
            app.shareProduct(msg.data.info);
        }
        else if (msg.data.type == "shareProductFB" )
        {
            app.shareProductFB(msg.data.info);
        }
        else if (msg.data.type == "addContact" )
        {
            app.addContact(msg.data.contactoInfo);
        }
        else if (msg.data.type == "openExternal" )
        {
            app.openExternal(msg.data.url);
        }
        
        

    },
    shareProduct:function(info){
        console.log(info);
        //DOC Plugin
        //https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
        //Limitaciones
        //http://www.joshmorony.com/posting-to-a-facebook-wall-with-phonegap-the-javascript-sdk/
        window.plugins.socialsharing.share(
            info.mensaje, 
            null, 
            info.imagen, 
            info.link);
    },
    shareProductFB:function(info){
        console.log(info);
        window.plugins.socialsharing.shareViaFacebook(
            'Mensaje vía Facebook',
            null /* img */,
            info.link /* url */,
            function() {console.log('share ok')},
            function(errormsg){alert(errormsg)})
    },
    addContact:function(info){
        var contacto = navigator.contacts.create({"displayName": info.nombre});

        var nombreContacto = new ContactName();
        nombreContacto.givenName = info.nombre;
        nombreContacto.familyName = "";

            contacto.name = nombreContacto;

        var telefonos = [];
        telefonos[0] = new ContactField('work', info.telefono, true);

            contacto.phoneNumbers = telefonos;

        contacto.note = "Contacto: Star Médica.";

        var direcciones = [];
        direcciones[0]= new ContactAddress({"pref": true});
        direcciones[0].type = 'home';
        direcciones[0].formatted = info.direccion;
        direcciones[0].streetAddress = info.direccion;
        direcciones[0].locality = info.hospital;
        direcciones[0].region = info.hospital;
        direcciones[0].postalCode = '00000';
        direcciones[0].country = 'México';

            contacto.addresses = direcciones;

        contacto.save(utiles.addContactSuccess,utiles.addContactError);

        console.log("El contacto, " + contacto.displayName + ", nota: " + contacto.note);
    },
    openExternal:function(link){
        console.log(link);
        /*if (link.indexOf("facebook.com") > -1)
        {
            //facebook
            if( ios )
            {
                appAvailability.check(
                    'fb://', // URI Scheme
                    function() {  // Success callback
                        window.open(link.replace("https://www.facebook.com/", "fb://"), "_system");
                    },
                    function() {  // Error callback
                        window.open(link, "_system");
                    }
                );
            }
            else
            {
                
            }
        }
        else if (link.indexOf("twitter.com") > -1){
            //twitter
            if( ios )
            {
                appAvailability.check(
                    'twitter://', // URI Scheme
                    function() {  // Success callback
                        window.open(link.replace("https://twitter.com/", "twitter://user?screen_name="), "_system");
                    },
                    function() {  // Error callback
                        window.open(link, "_system");
                    }
                );
            }
            else
            {
                appAvailability.check(
                    'com.twitter.android', // URI Scheme
                    function() {  // Success callback
                        window.open(link.replace("https://twitter.com/", "twitter://user?screen_name="), "_system");
                    },
                    function() {  // Error callback
                        window.open(link, "_system");
                    }
                );
            }
        }
        else if (link.indexOf("linkedin.com") > -1){
            //linkedin
        }
        else if (link.indexOf("plus.google.com") > -1){
            //Google Plus
        }
        else if (link.indexOf("pinterest.com") > -1){
            //Google Plus
        }
        else {*/
            window.open(link, "_system");
        /*}*/
    }
};

//Comunicacion entre el iframe y esta app
window.addEventListener("message", function(msg) {

    app.validarInteraccion(msg);
  
});

$(document).on('click','.cierreFancy',function(event){
    event.preventDefault();
    $.fancybox.close();
});

function onBackKeyDown(e) {
  e.preventDefault();
}