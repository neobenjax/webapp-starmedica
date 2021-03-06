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
            $boton = $(document.createElement('a')).addClass('cierreFancy').text(btnOk);
            $accionesConfirm.append($boton);
        }
        
        if(params.preload){
            $imgLoader = $(document.createElement('img')).addClass('preloader').attr('src','img/loading.gif');
            $accionesConfirm.append($imgLoader);
        }
        
        $contenedorAlerta
                .append($titulo)
                .append($textoMensaje)
                .append($accionesConfirm);
        
        configFancy.content = $contenedorAlerta;
        
        $.fancybox(configFancy);
    }

};

var source = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
if ( source ) {
    // PhoneGap application
    source_route = 'http://starmedica.codice.com/';
} else {
    // Web page
    source_route = 'http://localhost:81/StarMedica/';
}

intentos = 0,
internetIntentos=0,
linkIntentos=0;


var app = {
    version: 0,
    servicio : source_route+'webapp_service/index.php',
    urlsitio : source_route+'movil/home/index',
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('online', this.checkConnection('online'), false);
        document.addEventListener("offline", this.checkConnection('offline'), false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    checkConnection: function(caller){
        if(caller == 'offline') console.log('Se cayó la red');
        else{
            console.log('Caller:' + caller);
            var networkState = navigator.connection.type;
            var states = {};
            states[Connection.UNKNOWN]  = {tipo:-1,lbl:'Conexión desconocida'};
            states[Connection.ETHERNET] = {tipo:1,lbl:'Conexión ethernet'};
            states[Connection.WIFI]     = {tipo:2,lbl:'Conexión Wifi'};
            states[Connection.CELL_2G]  = {tipo:3,lbl:'2G'};
            states[Connection.CELL_3G]  = {tipo:4,lbl:'3G'};
            states[Connection.CELL_4G]  = {tipo:5,lbl:'4G'};
            states[Connection.CELL]     = {tipo:6,lbl:'Celular Conexión Baja'};
            states[Connection.NONE]     = {tipo:0,lbl:'Verifique su conexión a internet por favor!'};

            return states[networkState];
        }
    },
    onDeviceReady: function() {
        if( (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i)) )
            StatusBar.overlaysWebView(false);

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

        /*if (msg.data.type == "abrirMosaico")
        {
            app.abrirMosaico(false);
        }
        else if (msg.data.type == "putLogin")
        {
            app.putLogin(msg.data.nombreUsuario);
        }*/

    }
};
