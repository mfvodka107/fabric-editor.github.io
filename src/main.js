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

// use util js to change structure of object
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

var viewportLeft = 0,
viewportTop = 0,
mouseLeft,
mouseTop,
_drawSelection = canvas._drawSelection,
isDown = false;

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

var mods = 0;
canvas.counter = 0;
var newleft = 0;
canvas.selection = false;
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
		fabric.Image.fromURL('https://via.placeholder.com/100?text=data+image', function (img) {
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
            // pressed undo
        });

	registerButton($("#toolbar-circle"), function() {
            // insert circle
        });

	// common tool
	registerButton($("#toolbar-send-backward"), function() {
            // insert circle
        });

	registerButton($("#toolbar-bring-forward"), function() {
            // insert circle
        });

	// movement
	registerButton($("#toolbar-lockmovement"), function() {
            // insert circle
        });
	registerButton($("#toolbar-verticalmovement"), function() {
            // insert circle
        });
	registerButton($("#toolbar-horizonalmovement"), function() {

	});

	// scaling
	registerButton($("#toolbar-lockscaling"), function() {
	});
	registerButton($("#toolbar-verticalscaling"), function() {

	});
	registerButton($("#toolbar-horizonalscaling"), function() {

	});
	registerButton($("#toolbar-scaletoresize"), function() {

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
	//

	registerToggleButton($("#toolbar-bold"), function() {
            // set strong font weight
        }, function() {
            // set normal font weight
        });

	$("#toggle-bold").click(function() {
		toggle($("#toolbar-bold"), true);
	});



	/* --- color picker --- */
	$("#color-picker , #background-color-picker").colpick({
		colorScheme:'dark',
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
		},
		onSubmit:function(hsb,hex,rgb,el,bySetColor) {
			$(el).val('#'+hex);
			$(el).colpickHide();
		}
	});

});