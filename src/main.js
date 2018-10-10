import Vue from 'vue'
import App from './App.vue'

var canvasLayout = new Vue({
	el: '#app',
	render: h => h(App),
});

// json editor js created
var options = {
	/*onEditable: function (node) {
		switch (node.field) {
			default:
			return {
				field: false,
				value: true
			};
		}
	},*/
	onChangeText: function (json) {
		
		var activeObject = canvas.getActiveObject();
		json = JSON.parse(json);
		for (var key in json) {
			if (json.hasOwnProperty(key) && activeObject[key] != json[key]) {
				activeObject.set(key, json[key]);
			}
		}
		canvas.renderAll();
		saveJson();
	}
};
var container = document.getElementById("monitor");
window.editor = new JSONEditor(container , options);

// canvas fabric js created
var canvas = new fabric.Canvas('c-layout');
window.wcanvas = canvas;
canvas.selectionColor = 'rgba(0,255,0,0.2)';
canvas.selectionBorderColor = 'red';
canvas.selectionLineWidth = 1;

var viewportLeft = 0,
viewportTop = 0,
mouseLeft,
mouseTop,
_drawSelection = canvas._drawSelection,
isDown = false;

var mods = 0;
canvas.counter = 0;
var newleft = 0;

var copiedObject,
copiedObjects = new Array();

// use util js to change structure of object
canvas.on('object:selected', function (opt) {
	var target = opt.target;
	if (target._cacheCanvas) {

	}
})

canvas.on('mouse:wheel', function (opt) {
	var e = opt.e;
	if (!e.ctrlKey) {
		return;
	}
	var newZoom = canvas.getZoom() + e.deltaY / 300;
	canvas.zoomToPoint({
		x: e.offsetX,
		y: e.offsetY
	}, newZoom);

	renderVieportBorders();
	e.preventDefault();
	return false;
});


canvas.on('mouse:down', function (options) {
	if (options.e.altKey) {
		isDown = true;

		viewportLeft = canvas.viewportTransform[4];
		viewportTop = canvas.viewportTransform[5];

		mouseLeft = options.e.x;
		mouseTop = options.e.y;
		_drawSelection = canvas._drawSelection;
		canvas._drawSelection = function () {};
		renderVieportBorders();
	}
});

canvas.on('mouse:move', function (options) {
	if (options.e.altKey && isDown) {
		var currentMouseLeft = options.e.x;
		var currentMouseTop = options.e.y;

		var deltaLeft = currentMouseLeft - mouseLeft,
		deltaTop = currentMouseTop - mouseTop;

		canvas.viewportTransform[4] = viewportLeft + deltaLeft;
		canvas.viewportTransform[5] = viewportTop + deltaTop;

		canvas.renderAll();
		renderVieportBorders();
	}
});

canvas.on('mouse:up', function () {
	canvas._drawSelection = _drawSelection;
	isDown = false;
});
canvas.on(  'object:modified', onObjectModified,
	'object:added', function () {
		canvas.counter++;
		updateModifications(true);
	});

canvas.on('object:scaling', function(e) {
	console.log('object scaling');
	var toResize = true;
	canvasLayout.$watch('scale.toResize' , function (newValue, oldValue) {
		if (newValue !== toResize) {
			toResize = newValue;
		}
	});

	if (toResize) {
		if (e.target.type === 'group') {
			var groupScaleX = e.target.scaleX;
			var groupScaleY = e.target.scaleY;
			e.target.resizeToScale();
			e.target._objects.forEach(function(object) {
				object.resizeToScale(groupScaleX, groupScaleY, true);
			});
		} else {
			e.target.resizeToScale();
		}
	}

});

fabric.Canvas.prototype.preserveObjectStacking = true;

fabric.Object.prototype.resizeToScale = function(scaleX, scaleY, belongsToGroup) {
	var objectScaleX = scaleX || this.scaleX;
	var objectScaleY = scaleY || this.scaleY;
	switch (this.type) {
		case 'ellipse':
		this.rx = parseInt(this.rx * objectScaleX);
		this.ry = parseInt(this.ry * objectScaleY);
		this.width = this.rx * 2;
		this.height = this.ry * 2;
		this.scaleX = 1;
		this.scaleY = 1;
		if (belongsToGroup) {
			this.left *= objectScaleX;
			this.top *= objectScaleY;
		}
		break;

		default:
		this.width = parseInt(this.width * objectScaleX);
		this.height = parseInt(this.height * objectScaleY);
		this.scaleX = 1;
		this.scaleY = 1;
		if (belongsToGroup) {
			this.left *= objectScaleX;
			this.top *= objectScaleY;
		}
		break;
	}
	if (this.type == 'image') {
		console.log('Thay đổi kích cỡ ...' + this.width + 'x' + this.height);
		changeImgSrc(this , this.width , this.height);
		canvas.renderAll();
	}

};
var STEP = 1;

var Direction = {
	LEFT: 0,
	UP: 1,
	RIGHT: 2,
	DOWN: 3
};
fabric.util.addListener(document.getElementById('canvas-wrapper'), 'keydown', function (options) {

	options.preventDefault();
        /*if (options.repeat) {
            return;
        }*/
        STEP = ($("#step-key").val() > 0) ? parseInt($("#step-key").val()) : 1;
        var key = options.which || options.keyCode; // key detection
        if (key === 37) { // handle Left key
        	moveSelected(Direction.LEFT);
        } else if (key === 38) { // handle Up key
        	moveSelected(Direction.UP);
        } else if (key === 39) { // handle Right key
        	moveSelected(Direction.RIGHT);
        } else if (key === 40) { // handle Down key
        	moveSelected(Direction.DOWN);
        } else if (key === 46) {
        	var activeObjects = canvas.getActiveObjects();
        	canvas.discardActiveObject()
        	if (activeObjects.length) {
        		canvas.remove.apply(canvas, activeObjects);
        	}
        }
        
        if (key == 90 && options.ctrlKey) {
        	console.log('Ctrl + z pressed.');
        	undo();
        }
        if (key == 89 && options.ctrlKey) {
        	console.log('Ctrl + y pressed.');
        	redo();
        }

        if (key == 67 && options.ctrlKey) {
        	console.log('Ctrl + c pressed.');
        	copy();
        }
        if (key == 86 && options.ctrlKey) {
        	console.log('Ctrl + v pressed.');
        	paste();
        	onObjectModified();
        }
        

    });

function moveSelected(direction) {
	var activeObject = canvas.getActiveObject();

	if (activeObject) {
		onObjectModified();
		switch (direction) {
			case Direction.LEFT:

			activeObject.left -= STEP;
			break;
			case Direction.UP:
			activeObject.top -= STEP;
			break;
			case Direction.RIGHT:
			activeObject.left += STEP;
			break;
			case Direction.DOWN:
			activeObject.top += STEP;
			break;
		}
		activeObject.setCoords();
		canvas.renderAll();

	} else {
		console.log('no object selected');
	}

}

function changeImgSrc(activeObject, obWidth, obHeight) {
	var img = new Image();
	img.onload = function() {
		activeObject.setElement(img);
	}
	var image_text = 'image';
	if ('data' in activeObject && activeObject.data.arg == 'profile') {
		var image_text = 'profile+avatar';
		if ('year' in activeObject.data) {
			var image_text = 'avatar+'+activeObject.data.year;
		}
	}
	if ('data' in activeObject && 'image' in activeObject.data) {
		var image_text = 'data+image';
	}

	if ('data' in activeObject && activeObject.data.arg == 'photoFb') {
		var image_text = 'photo+fb+'+activeObject.data.byType;
	}

	console.log('change image src ...' + 'https://via.placeholder.com/' + obWidth + 'x' + obHeight + '?text=' + image_text);
	img.src = 'https://via.placeholder.com/' + obWidth + 'x' + obHeight + '?text=' + image_text;
}

function setAttr(name, value, ob) {
	ob.toObject = (function (toObject) {
		return function () {
			return fabric.util.object.extend(toObject.call(this), {
				[name]: value
			});
		};
	})(ob.toObject);
}

function renderVieportBorders() {
	var ctx = canvas.getContext();
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,0,0.1)';
	ctx.fillRect(
		canvas.viewportTransform[4],
		canvas.viewportTransform[5],
		canvas.getWidth() * canvas.getZoom(),
		canvas.getHeight() * canvas.getZoom());
	ctx.setLineDash([5, 5]);
	ctx.strokeRect(
		canvas.viewportTransform[4],
		canvas.viewportTransform[5],
		canvas.getWidth() * canvas.getZoom(),
		canvas.getHeight() * canvas.getZoom());
	ctx.restore();
}

function saveJson() {
	canvas.toJSON(['selectable' , 'evented' , 'data' , 'isbackground']);

	window.consoleJSON = JSON.stringify(canvas);
	fabricJSON = JSON.parse(window.consoleJSON);

}
function loadJson(json) {
	canvas.loadFromJSON(json, function () {

		canvas.renderAll();
		for (var i = fabricJSON.objects.length - 1; i >= 0; i--) {
			if ('data' in fabricJSON.objects[i]) {
				setAttr('data', fabricJSON.objects[i].data, canvas.getObjects()[i]);
			}
			if ('isbackground' in fabricJSON.objects[i]) {
				setAttr('isbackground', true, canvas.getObjects()[i]);
				setAttr('selectable', false, canvas.getObjects()[i]);
				setAttr('evented', false, canvas.getObjects()[i]);
			}
		}
	});
}
function onObjectModified() {
	console.log('Object changed');

	updateModifications(true);
	saveJson();
};

function updateModifications(savehistory) {
	if (savehistory === true) {
		console.log('save history')
		canvas.toJSON(['selectable' , 'evented' , 'data' , 'isbackground']);
		var myjson = JSON.stringify(canvas);
		state.push(myjson);
	}
}
function undo() {
	if (mods < state.length) {
		loadJson(state[state.length - 1 - mods - 1]);
		mods += 1;
	}
}
function redo() {
	if (mods > 0) {
		canvas.clear().renderAll();
		loadJson(state[state.length - 1 - mods + 1]);
		mods -= 1;
	}
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function delete_cookie(name) {
  setCookie(name, "", -1);
}

function copy(){
    copiedObjects = new Array();
    if(canvas.getActiveObjects()){
        //console.log(canvas.getActiveGroup().getObjects());
        canvas.getActiveObjects().forEach(function(o){
            var object = fabric.util.object.clone(o);
            copiedObjects.push(object);
        });             
    }
    else if(canvas.getActiveObject()){
        var object = fabric.util.object.clone(canvas.getActiveObject());
        copiedObject = object;
        copiedObjects = new Array();
        
    }
}

function paste(){
    if(copiedObjects.length > 0){
        for(var i in copiedObjects){
            copiedObjects[i]=fabric.util.object.clone(copiedObjects[i]);
            
            copiedObjects[i].set("top", copiedObjects[i].top+100);
            copiedObjects[i].set("left", copiedObjects[i].left+100);
            
            canvas.add(copiedObjects[i]);
            canvas.item(canvas.size() - 1).hasControls = true;
        }                
    }
    else if(copiedObject){
        copiedObject= fabric.util.object.clone(copiedObject);
        copiedObject.set("top", 150);
        copiedObject.set("left", 150);
        canvas.add(copiedObject);
        canvas.item(canvas.size() - 1).hasControls = true;
    }
    canvas.renderAll();  
}

function setActiveProp(name, value) {
	var object = canvas.getActiveObject();
	if (!object) return;
	object.set(name, value).setCoords();
	canvas.renderAll();
}

// register and create function for gtoolbar button
$(function() {
	registerButton($('#toolbar-text'), function() {
		var newtext = new fabric.Textbox('new textbox', {
			fontSize: 20,
			left: getRandomInt(0, 100),
			top: getRandomInt(0, 100),
			fontFamily: 'helvetica',
			angle: 0,
			fill: '#000000',
			scaleX: 1,
			scaleY: 1,
			fontWeight: '',
			originX: 'left',
			width: 300,
			hasRotatingPoint: true,
			centerTransform: true,
		});
		canvas.add(newtext);
	});
	registerButton($('#toolbar-new-image'), function() {
		fabric.Image.fromURL('https://via.placeholder.com/100?text=image', function (img) {
			img.set({
				left: 0,
				top: 0,
				width: 100,
				height: 100
			})
			.scale(1)
			.setCoords();
			canvas.add(img);
		});
	});
	registerButton($("#toolbar-undo"), function() {
		undo();
	});
	registerButton($("#toolbar-redo"), function() {
		redo();
	});

	registerButton($("#toolbar-circle"), function() {
            // insert circle
        });

	// common tool
	registerButton($("#toolbar-send-backward"), function() {
		var activeObject = canvas.getActiveObject();
		if (activeObject) {
			canvas.sendBackwards(activeObject);
		}
	});

	registerButton($("#toolbar-bring-forward"), function() {
		var activeObject = canvas.getActiveObject();
		if (activeObject) {
			canvas.bringForward(activeObject);
		}
	});

	// movement
	registerToggleButton($("#toolbar-lockmovement"), function() {
		setActiveProp('lockMovementX', true);
		setActiveProp('lockMovementY', true);
	}, function() {
		setActiveProp('lockMovementX', false);
		setActiveProp('lockMovementY', false);
	});

	registerToggleButton($("#toolbar-verticalmovement"), function() {
		setActiveProp('lockMovementX', true);
	}, function() {
		setActiveProp('lockMovementX', false);
	});

	registerToggleButton($("#toolbar-horizonalmovement"), function() {
		setActiveProp('lockMovementY', true);
	}, function() {
		setActiveProp('lockMovementY', false);
	});
	

	// scaling
	registerToggleButton($("#toolbar-verticalscaling"), function() {
		setActiveProp('lockScalingX', true);
	}, function() {
		setActiveProp('lockScalingX', false);
	});
	registerToggleButton($("#toolbar-horizonalscaling"), function() {
		setActiveProp('lockScalingY', true);
	}, function() {
		setActiveProp('lockScalingY', false);
	});
	registerToggleButton($("#toolbar-scaletoresize"), function() {
		canvasLayout.$data.scale.toRezise = true;
	}, function() {
		canvasLayout.$data.scale.toRezise = false;
	});


	registerButton($("#toolbar-lockrotation"), function() {

	});
	registerButton($("#toolbar-lockrotation-flip"), function() {

	});

	// data object
	registerButton($("#toolbar-newdata"), function() {
            // insert circle
        });
	registerButton($("#toolbar-editdata"), function() {
            // insert circle
        });
	registerButton($("#toolbar-deletedata"), function() {
            // insert circle
        });

	

	// end common tool
	// textbox editor tool
	
	// end textbox editor tool

	registerToggleButton($("#toolbar-bold"), function() {
            // set strong font weight
        }, function() {
            // set normal font weight
        });

	$("#toggle-bold").click(function() {
		toggle($("#toolbar-bold"), true);
	});



	/* --- color picker --- */
	$("#color-picker").colpick({
		colorScheme:'dark',
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
			setActiveProp('fill', '#'+hex);
		},
		onSubmit:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
			$(el).colpickHide();
			setActiveProp('fill', '#'+hex);
		}
	});
	$("#background-color-picker").colpick({
		colorScheme:'dark',
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
			setActiveProp('backgroundColor', '#'+hex);
		},
		onSubmit:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
			$(el).colpickHide();
			setActiveProp('backgroundColor', '#'+hex);
		}
	});

});