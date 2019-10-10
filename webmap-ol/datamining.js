// Load vector layer from the WFS service
function defineVectorLayer(layername, featurestatus){
  var vectorLayer = new ol.layer.Vector({
    title: featurestatus,
    source: new ol.source.Vector({
      renderMode: 'image', // Vector layers are rendered as images. Better performance. Default is 'vector'.
      format: new ol.format.GeoJSON(),
      url: function(extent) {
        return  'http://152.7.99.155:8080/geoserver/potatoBlight/wfs?service=WFS' +
                '&version=1.0.0&request=GetFeature'+
                '&typeName=potatoBlight:'+ layername +
                // '&styles=' +
                // '&CQL_FILTER=status=%27'+ featurestatus +'%27' +
                '&CQL_FILTER=strToLowerCase(status)=%27'+ featurestatus +'%27' +
               '&outputFormat=application/json&srsname=EPSG:3857'
              // + '&bbox=' + extent.join(',') + ',EPSG:3857'; // CQL filter and bbox are mutually exclusive. comment this to enable cql filter
      },
      strategy: ol.loadingstrategy.bbox,
    }),
    style: styleFunction, // Setting style in GeoServer SLD files 
  });
  return vectorLayer;
};

function createLayersGroups(layerNames, layerStatus){
  var layersDict = {};
  var layersGroup = [];
  for (n of layerNames){
    layersDict[n] = [];
    for (s of layerStatus){
      layersDict[n].push(defineVectorLayer(n, s));
    }
  };
  for (var key in layersDict){
    var g = new ol.layer.Group({
      title: key,
      fold: 'open',
      layers: layersDict[key]
    });
    layersGroup.push(g);
  }
  return layersGroup;
};

function buttonSwitch(i, length){
  if (i <= 0){
    previousButton.style.visibility = "hidden";
  } else if (i >= length -1){
    nextButton.style.visibility = "hidden";
  } else {
    previousButton.style.visibility = "visible";
    nextButton.style.visibility = "visible";
  }
};

function setContent(layerID, pointID,locationname, paragraph, status, comment){
  start = paragraph.indexOf(locationname);
  end = start+locationname.length;
  var popupContent = `<b>` + layerID + `</b> <b>Ponit ID- `+ pointID + `</b>: ` + locationname + 
  `<br>` + paragraph.substring(0, start) + "<b>" + locationname + "</b>" + paragraph.substring(end, ) + 
  `<br>
  <select id='status'>
  <option value='default' selected='selected' disabled>`+ status + `</option>
  <option value="accept">accept</option>
  <option value="move">move</option>
  <option value="uncertain">uncertain</option>
  <option value="default">default</option>
  <option value="archive">archive</option>
  <option value="remove">remove</option>
  </select><br>
  Comments: <input type='text' id='commentsOnPoint' placeholder="` + comment +`">&nbsp;` ;
  console.log(comment);
  return popupContent;
};

// control the color scheme of the point features based on the status
function styleFunction(feature) {
  var color;
  if (feature.get("status")=="remove"){
    color = [237,248,251];
  } else if (feature.get("status")=="archive"){
    color = [203,201,226];
  } else if (feature.get("status")=="uncertain"){
    color = [158,154,200]; 
  } else if (feature.get("status")=="move"){
    color = [117,107,177];
  } else if (feature.get("status")=="accept"){
    color = [84,39,143];
  } else {
    color = [244, 188, 66];
  };
  var reStyle = new ol.style.Style({
    image: new ol.style.Circle({
         radius: 5,
         fill: new ol.style.Fill({
             color: color
         }),
         stroke: new ol.style.Stroke({
           color:"dark grey",
           width: 0.5
         })
    })
 });
    return reStyle;
};

function getData(multiFeatures, featureIndex, fLength){
  var f = multiFeatures[featureIndex];
  var layerID = f.getId().toString().split('.')[0];
  var pointID = f.get('id');
  var locationname = f.get('matchednam');
  var plist = [f.get('paragragh1'), f.get('paragragh2'), f.get('paragragh3'), f.get('paragragh4'), f.get('paragragh5'), f.get('paragragh6'), f.get('paragragh7'), f.get('paragragh8'), f.get('paragragh9')];
  var paragraph = '';
  for (i = 0; i < plist.length; i++) {
    if (null != plist[i]){
      paragraph = paragraph + plist[i]
    };
  }; 
  var status = f.get('status');
  var comment = f.get('comment');

  currentFeature = f;
  currentPointID = pointID;
  console.log(f.getId());
  console.log(layerID);

  content.innerHTML = setContent(layerID, pointID,locationname, paragraph, status, comment);
  overlay.setPosition(coordinate);
  pointNumber.innerHTML = "( " + (featureIndex + 1) + " of " + fLength + " )";
};

function toggleNav() {
  navSize = document.getElementById("tableSidenav").style.height;
  // If the height of table navigation bar equals to 250 px (the table is opened), close the table; otherwise, open it.
  if (navSize == "50%"){
    console.log("close");
    return closeNav();
  }
  return openNav();
}

function openNav() {
  document.getElementById("tableSidenav").style.height = "50%";
  document.getElementById("map").style.marginBottom = "50%";
}

function closeNav() {
  document.getElementById("tableSidenav").style.height = "0";
  document.getElementById("map").style.marginBottom= "0";
}

function highlightFeature(feat){
  interactionSelect.getFeatures().push(feat);
  interactionSelect.dispatchEvent({
     type: 'select',
     selected: [feat],
     deselected: []
  });
};

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var pointNumber = document.getElementById('number-of-points');
var nextButton = document.getElementById('next-button');
var previousButton = document.getElementById('previous-button');
var submitButton = document.getElementById('submit');
var zoom2feature = document.getElementById('zoom2feature');

var featureIndex;               
var multiFeatures;
var currentPointID;
var currentFeature;
var currentLayer;


var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

// click close button to close the popup window
closer.onclick = function(){
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Need to figure out the syntax of view.fit
// zoom2feature.onclick = function(){
//   map.getView().fit(layer45.getSource().getExtent(), [50, 50]);
// };

// submit status and comments to the postGIS database
submitButton.onclick = function (){
  var updatedStatus = document.getElementById('status').value;
  var updatedComment = document.getElementById('commentsOnPoint').value;
  currentFeature.setProperties({'status': updatedStatus, 'comment': updatedComment});
  var newp = currentFeature.getProperties();
  delete newp.bbox;
  var newID = currentFeature.getId();

  var clone = new ol.Feature(newp);
  clone.setId(newID);
  clone.setGeometryName('geom');
  transactWFS('update', clone);
  overlay.setPosition(undefined);
  closer.blur();
};

// click next button to go to the next point
nextButton.onclick = function(){
  featureIndex = featureIndex + 1;
  var fLength = multiFeatures.length;
  buttonSwitch(featureIndex, fLength);
  getData(multiFeatures, featureIndex, fLength);
};

// // click previous button to go back to the previous point
previousButton.onclick = function(){
  featureIndex = featureIndex - 1;
  var fLength = multiFeatures.length;
  buttonSwitch(featureIndex,fLength);
  getData(multiFeatures, featureIndex, fLength);
};

var formatWFS = new ol.format.WFS();

// function defineGML(currentLayer){
var formatGML = new ol.format.GML({
  featureNS: 'http://potatoBlight',
  featureType: 'a_45disease_extend0',
  //  featureType: currentLayer,
  srsName: 'EPSG:3857'
});
  // return formatGML;
// };

var xs = new XMLSerializer();

// Enable transactional WFS
var transactWFS = function (mode, f) {
  var node;
  // var GML = defineGML;
  switch (mode) {
      case 'insert':
          node = formatWFS.writeTransaction([f], null, null, formatGML);
          break;
      case 'update':
          node = formatWFS.writeTransaction(null, [f], null, formatGML);
          break;
      case 'delete':
          node = formatWFS.writeTransaction(null, null, [f], formatGML);
          break;
  }
  var payload = xs.serializeToString(node);
  $.ajax('http://152.7.99.155:8080/geoserver/potatoBlight/wfs', {
      type: 'POST',
      dataType: 'xml',
      processData: false,
      contentType: 'text/xml',
      data: payload
  }).done(function() {
    // source45.clear();
  });
};


// Define pointer move interaction on the layers. The sytle is default.
var interactionSelectPointerMove = new ol.interaction.Select({
  condition: ol.events.condition.pointerMove
});

var interactionSelect = new ol.interaction.Select({
});

var layerNames = ['a_43disease_old0', 'a_44disease_old0', 'a_45disease_extend0']; //'a_43disease_extend0', 'a_44disease_extend0'
var layerStatus = ["remove", "archive", "default", "uncertain", "move", "accept"];
gList = createLayersGroups(layerNames, layerStatus);

var mapLayers = [
  new ol.layer.Group({
    title: "Base maps", 
    layers: [
      new ol.layer.Tile({
        title: "Open Street Map",
        type: "base",
        visible: true,
        source: new ol.source.OSM()
      }),

    ]
  }),
  new ol.layer.Group({
    title: "Layers",
    fold: 'open',
    layers: gList
  })
];

var map = new ol.Map({
  target: 'map',
  loadTilesWhileAnimating: true,
  loadTilesWhileInteracting: true,
	controls:[
		new ol.control.OverviewMap(),
		new ol.control.Zoom(),
		new ol.control.ScaleLine(),
  ],
  interactions: [
    interactionSelectPointerMove,
    new ol.interaction.MouseWheelZoom(),
    new ol.interaction.DragPan(),
    interactionSelect,
  ],

  layers: mapLayers,
  overlays:[overlay],
  view: new ol.View({
    center: ol.proj.fromLonLat([-25.922388,30.193475]),
    zoom: 3   
    }),
});

var layerSwitcher = new ol.control.LayerSwitcher({
  tipLabel: 'Légende',
  groupSelectStyle: 'children'
});
map.addControl(layerSwitcher);


map.on('singleclick', function(evt){
  var featureExists = map.hasFeatureAtPixel(evt.pixel);

  if (featureExists){
    coordinate = evt.coordinate;
    multiFeatures = map.getFeaturesAtPixel(evt.pixel);
    featureIndex = 0;
    var fLength = multiFeatures.length;
    if (fLength > 1){
      buttonSwitch(featureIndex, fLength);
      nextButton.style.visibility = "visible";
    } else {
      nextButton.style.visibility = "hidden";
      previousButton.style.visibility = 'hidden';
    };

    getData(multiFeatures, featureIndex, fLength);
  } else {
    overlay.setPosition(undefined);
  }
});

// If there is any feature at the event pixel (where the mouse points at), the pointer will change to the 'hand' symbol
map.on('pointermove', function(e) {
  if (e.dragging) {
      return;
  }
  var pixel = map.getEventPixel(e.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);

  e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

// Create attribute table using Jquery library DataTable
function createTabTable(attributeTableID, layerID){
  // Use the new 'DataTable' function rather than the older one 'dataTable'
  var table = $(attributeTableID).DataTable({
    responsive: 'true',
    // dom: 'iBfrtlp',
    "dom": '<"top"fB>rt<"bottom"lip>',
    buttons: [
      { 
        extend: 'excelHtml5',
        exportOptions: {
            columns: ':visible'
        }
      },
    ],
    "scrollX": true,
    "ajax":{
      // Delete the limitation: maxFeatures=50
      // Solved from Stackoverflow questions no.48147970
      "url": 'http://152.7.99.155:8080/geoserver/potatoBlight/wfs?service=WFS'+ 
      '&version=1.0.0&request=GetFeature'+
      '&typeName=potatoBlight:'+ layerID +
      '&outputFormat=application/json',
      "dataSrc": "features"
    },
    "columns": [
      { "title": "ID",
        data: "properties.id",
        "class": "center"},
      { "title": "Place_Name",
        data: "properties.matchednam",
        "class": "center"},
      { "title": "Status",
        data: "properties.status",
        "class": "center"},
      { "title": "Comment",
        data: "properties.comment",
        "class": "center"},
      { "title": "Paragraph",
        data: "properties",
        render: function(data, type, row){
          return data.paragragh1 + data.paragragh2 + data.paragragh3 + data.paragragh4},
        "class": "center"},
      ],
  });
  
  return table;
};

document.getElementById("tab-1").innerHTML = "1845 disease";
document.getElementById("tab-2").innerHTML = "1844 disease";
document.getElementById("tab-3").innerHTML = "1843 disease";
var table45 = createTabTable('#attributeTb', 'a_45disease_extend0');
var table44 = createTabTable('#attributeTb2', 'a_44disease_old0');
var table43 = createTabTable('#attributeTb3', 'a_43disease_old0');

var tableDict = {
  "#attributeTb": table45,
  "#attributeTb2": table44,
  "#attributeTb3": table43,
}

$('a[data-toggle="tab"]').on( 'shown.bs.tab', function (e) {
  $.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();
  } );

// CellEdit plug-in
// table.MakeCellsEditable({
//   "onUpdate": myCallbackFunction,
  // "inputCss":'my-input-class',
  // "columns": [2,3],
  // // "allowNulls": {
  // //     "columns": [3],
  // //     "errorClass": 'error'
  // // },
  // "confirmationButton": { // could also be true
  //     "confirmCss": 'my-confirm-class',
  //     "cancelCss": 'my-cancel-class'
  // },
  // "inputTypes": [
  //     {
  //         "column": 2,
  //         "type": "list",
  //         "options": [
  //           {"value": "accept", "display": "accept"},
  //           {"value": "move", "display": "move"},
  //           {"value": "uncertain", "display": "uncertain"},
  //           {"value": "default", "display": "default"},
  //           {"value": "archive", "display": "archive"},
  //           {"value": "remove", "display": "remove"}
  //         ]
  //     },
  //     {
  //         "column": 3, 
  //         "type": "text",
  //         "options": null
  //     },      
  // ]
// });

// function myCallbackFunction (updatedCell, updatedRow, oldValue) {
//   console.log("The new value for the cell is: " + updatedCell.data());
//   console.log("The old value for that cell was: " + oldValue);
//   console.log("The values for each cell in that row are: " + updatedRow.data());
// }

// Select (highlight) the point feature from the attribute table
var pStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 15,
    fill: new ol.style.Fill({
        color: "yellow"
    }),
    stroke: new ol.style.Stroke({
      color:"dark grey",
      width: 0.5
    })
  })
});


// Select the row in the attribute table will also highlight the point on the map.
// It doesn't enable multiple selection.
$('.tab-content tbody').on('click', 'tr', function () {
  interactionSelect.getFeatures().clear(); // Clear the selected features
  
  var currentTableID = $(this).closest('table').attr('id');
  var currentTable = tableDict["#"+currentTableID];
  
  // $(this).toggleClass('selected');
  if ($(this).hasClass('selected')) { // If the row is selected,
    $(this).removeClass('selected'); // deselect it
  } else {
    $('tr.selected').removeClass('selected'); // Remove all the selected rows in the table
    $(this).addClass('selected'); // Select the row
    var long = currentTable.row(this).data().properties["longitude"];
    var lat = currentTable.row(this).data().properties["latitude"];
    console.log(currentTable.row(this).data().id, lat, long)
    
    // Create a new point featue of the selected row
    var selectedFeatures = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([long, lat])
      )
    });

    highlightFeature(selectedFeatures)
  }
});