let data;
let minLength = Infinity, maxLength = 0;
let minArea = Infinity, maxArea = 0;

// Min/max della temperatura per continente (necessari per i gradienti colorati)
let contMinTemp = {}, contMaxTemp = {};

let continentGradient = {
  'Africa':        ['#856135', '#EB9E00'],
  'Asia':          ['#57000A', '#EB3800'],
  'Oceania':       ['#B8005A', '#FFA6D1'],
  'Australia':     ['#B8005A', '#FFA6D1'],
  'Europe':        ['#2F25B8', '#00B9EB'],
  'North America': ['#4A4A4A', '#D0D0D0'],
  'South America': ['#23572B', '#9FBD00'],
};

let continentOrder = ['Africa', 'Asia', 'Oceania', 'Australia', 'Europe', 'North America', 'South America'];

// Variabili di impaginazione geometrica
let margin = 24;
let topBand = 184;      
let rowH = 26;          
let labelH = 34;        
let leftMargin = 0;     
let seaReserve = 150; 
let altezzaTotale = 0; 

async function setup() {
  createCanvas(windowWidth, windowHeight);
  data = await loadTable("assets/rivers.csv", ",", "header");

  for (let i = 0; i < data.getRowCount(); i++) {
    let length = data.getNum(i, "length");
    let area = data.getNum(i, "area");
    let temp = data.getNum(i, "avg_temp");
    let continent = data.getString(i, "continent");

    minLength = min(minLength, length); maxLength = max(maxLength, length);
    minArea = min(minArea, area);       maxArea = max(maxArea, area);

    if (!(continent in contMinTemp)) {
      contMinTemp[continent] = temp;
      contMaxTemp[continent] = temp;
    } else {
      contMinTemp[continent] = min(contMinTemp[continent], temp);
      contMaxTemp[continent] = max(contMaxTemp[continent], temp);
    }
  }

  altezzaTotale = topBand + continentOrder.length * labelH + data.getRowCount() * rowH + margin;
  
  resizeCanvas(windowWidth, altezzaTotale);
  textFont("Helvetica");
}

function draw() {

  background('#0a1128');
  
  textStyle(NORMAL); 
  textSize(12);
  textAlign(LEFT, TOP);

 
  fill(255);
  noStroke();
  textStyle(BOLD);
  textSize(40);
  text("I fiumi più lunghi del mondo", margin, 14);
  
  textStyle(NORMAL);
  textSize(12.5);
  fill(185);
  text("Ogni fiume è una linea ondulata: lunghezza linea = lunghezza del fiume · spessore = area del bacino · in fondo il nome del fiume.", margin, 66);
  text("Colore = continente. La tinta va dal fiume più FREDDO (scura) al più CALDO (accesa).", margin, 84);


  let y = topBand;
  let lineAreaW = width - leftMargin - seaReserve;
  let activeTooltip = null; 


  let startY = topBand + labelH - 10; 
  let endY = altezzaTotale - margin;
  stroke('#e6ccb2');
  strokeWeight(6); 
  strokeCap(ROUND);
  line(leftMargin, startY, leftMargin, endY);

  for (let continent of continentOrder) {
    
    let haFiumi = false;
    for (let i = 0; i < data.getRowCount(); i++) {
      if (data.getString(i, "continent") === continent) { haFiumi = true; break; }
    }
    
    if (haFiumi) {
      y += labelH;
      fill(255);
      noStroke();
      textStyle(BOLD);
      textSize(17);
      text(continent, leftMargin + 8, y - labelH * 0.45); 
      textStyle(NORMAL);
    }

    for (let i = 0; i < data.getRowCount(); i++) {
      if (data.getString(i, "continent") !== continent) continue;

      let cy = y + rowH / 2;
      let length = data.getNum(i, "length");
      let area = data.getNum(i, "area");
      let temp = data.getNum(i, "avg_temp");
      let name = data.getString(i, "name");
      let outflow = data.getString(i, "outflow"); 

      let lineLen = map(length, minLength, maxLength, 40, lineAreaW);
      
  
      textSize(min(12, rowH * 0.5));
      let xEnd = leftMargin + lineLen + 8 + textWidth(name); 

      let isHovered = (mouseX >= leftMargin && mouseX <= xEnd && abs(mouseY - cy) <= rowH / 2);

      let g = continentGradient[continent] || ['#555555', '#CCCCCC'];
      let lo = contMinTemp[continent];
      let hi = contMaxTemp[continent];
      let t = (hi > lo) ? (temp - lo) / (hi - lo) : 1;
      let col = lerpColor(color(g[0]), color(g[1]), constrain(t, 0, 1));

      let logNorm = map(log(area), log(minArea), log(maxArea), 0, 1);
      let thickness = 1 + pow(logNorm, 1.6) * (rowH * 0.95 - 1);

      noFill();
      stroke(col);
      strokeWeight(thickness);
      strokeCap(ROUND);
      
      beginShape();
      for (let x = 0; x <= lineLen; x += 4) {
        vertex(leftMargin + x, cy + sin(x * 0.045) * 2.4);
      }
      endShape();

      noStroke();
      fill(isHovered ? 255 : 185); 
      textAlign(LEFT, CENTER);
      textSize(min(12, rowH * 0.5));
      text(name, leftMargin + lineLen + 8, cy);

      if (isHovered) {
        activeTooltip = { name, length, area, temp, outflow };
      }

      y += rowH;
    }
  }

  if (activeTooltip) {
    let txtName = activeTooltip.name.toUpperCase();
    let txtLen  = "Lunghezza: " + activeTooltip.length + " km";
    let txtArea = "Bacino: " + activeTooltip.area.toLocaleString() + " km²";
    let txtTemp = "Temp. Media: " + activeTooltip.temp + " °C";
    let txtOut  = "Sfocia in: " + activeTooltip.outflow;

    textSize(13);
    let nameW = textWidth(txtName);
    textSize(11);
    let maxW = max([nameW, textWidth(txtLen), textWidth(txtArea), textWidth(txtTemp), textWidth(txtOut)]);
    let boxW = maxW + 24;
    let boxH = 96;

    let bx = constrain(mouseX + 15, 0, width - boxW);
    let by = constrain(mouseY + 15, 0, height - boxH);

    fill(25, 25, 25, 230);
    stroke(255, 40);
    strokeWeight(1);
    rect(bx, by, boxW, boxH, 6);

    noStroke();
    textAlign(LEFT, TOP);
    fill(255);
    textStyle(BOLD);
    textSize(13);
    text(txtName, bx + 12, by + 12);

    fill(200);
    textStyle(NORMAL);
    textSize(11);
    text(txtLen, bx + 12, by + 32);
    text(txtArea, bx + 12, by + 46);
    text(txtTemp, bx + 12, by + 60);
    text(txtOut, bx + 12, by + 74);
  }
}
