console.log("PKU DSA 21 Stellar VIS. Powered by Mimi.");

let width = window.innerWidth;
let height = window.innerHeight;

let MARGIN = 1 / 14;
let NODE_SIZE = Math.min(width, height) * MARGIN * 0.8;

const colors = [
  d3.schemeGreys[6].reverse(), d3.schemeBlues[6].reverse(), d3.schemeReds[6].reverse()
];

let frame = 0;
let database = [];

const TRANSITION_COLOR_TEXT = 500;
const TRANSITION_ARMY_FADE = 250;
const TRANSITION_ARMY_MOVE = 1000;

function normalize(r) {
  if (r < 20) r = 20;
  if (r > 100) r = 100;
  return (Math.log(r) - Math.log(5)) / (Math.log(100) - Math.log(5)) * NODE_SIZE + "px";
}

d3.select("#preview")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .classed("layout", true)
  .on("dblclick", () => { })
  .on("click", () => { });

function loadMap(data) {
  localStorage.setItem("select-data", data);
  d3.selectAll(".layout *").remove();
  const { nodes, links } = data;

  const link = d3.select(".layout")
    .selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .classed("link", true)
    .attr("stroke-width", 5)
    .attr("stroke", colors[0][2]);

  const circle = d3.select(".layout")
    .selectAll(".circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("id", d => "node-" + d.name)
    .attr("r", (d, i) => {
      const r = Math.max(...d.power);
      return normalize(r);
    })
    .classed("circle", true)
    .style("fill", (d, i) => colors[d.owner + 1][d.type === "Base" ? 0 : 1])
    .on("click", onclick)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  d3.selectAll(".layout .fab").each((d, i) => {
    if (d.fx || d.fy) return;
    if (d.owner === 0) {
      d.fx = width * 0.15;
      d.fy = height * 0.15;
    } else {
      d.fx = width * 0.85;
      d.fy = height * 0.85;
    };
  });

  const text = d3.select(".layout")
    .selectAll(".text")
    .data(nodes)
    .enter()
    .append("text")
    .classed("text", true)
    .style("font-size", "2em")
    //.attr("dominant-baseline", "top")
    .attr("text-anchor", "middle")
    .style("fill", (d, i) => colors[d.owner + 1][3])
    .text(d => Math.max(...d.power).toFixed(2));

  const simulation = d3.forceSimulation(nodes)
    .velocityDecay(0.2)
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().distance(width / 8).links(data.links))
    .force("collide", d3.forceCollide())
    .force("charge", d3.forceManyBody().strength(-2000))
    .on("tick", ticked);

  function ticked() {
    link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    circle.attr("cx", d => d.x)
      .attr("cy", d => d.y);

    text.attr("x", d => d.x)
      .attr("y", d => d.y + 10);
  }

  function onclick(event, d) {
    if (d.fx) d.fx = null;
    if (d.fy) d.fy = null;

    simulation.alpha(0.1).restart();
  }

  function dragstarted(event, d) {
    d3.select(this)
      .classed("active", true);
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;

    simulation.alpha(0.1).restart();
  }

  function dragended() {
    d3.select(this)
      .classed("active", false);
  }
}

function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.files) {
    // Use DataTransferItemList interface to access the file(s)
    const file = ev.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = event => {
      if (file.type === "application/json") {
        loadData(JSON.parse(event.target.result));
      } else {
        document.body.style.setProperty("background-image", `url(${event.target.result})`);
        localStorage.setItem("background-image", `url(${event.target.result})`);
      }
    };
    if (file.type === "application/json") {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }
}

function updateMap(data) {

  d3.select(".layout")
    .selectAll(".circle")
    .transition()
    .duration(TRANSITION_COLOR_TEXT)
    .attr("r", (d, i) => {
      const r = Math.max(...data.power[i + 1]);
      return normalize(r);
    })
    .style("fill", (d, i) => colors[data.owner[i + 1] + 1][d.type === "Base" ? 0 : 1]);

  d3.select(".layout")
    .selectAll(".text")
    .transition()
    .duration(TRANSITION_COLOR_TEXT)
    .style("fill", (d, i) => colors[data.owner[i + 1] + 1][3])
    .textTween(function(d, i) {
      const f = Math.max(...data.power[i + 1]);
      const interpolate = d3.interpolate(d3.select(this).text(), f);
      return t => interpolate(t).toFixed(2);
    });

  d3.select(".layout")
    .selectAll(".link")
    .transition()
    .duration(TRANSITION_COLOR_TEXT)
    .attr("stroke", (d, i) => {
      if (data.owner[d.source.name] === 0 && data.owner[d.target.name] === 0) return colors[1][2];
      if (data.owner[d.source.name] === 1 && data.owner[d.target.name] === 1) return colors[2][2];
      return colors[0][2];
    });
}

function updateFrame() {
  document.querySelector(".frame").innerText = frame + 1 + "/" + database.length;
}

function loadData(db) {
  database = db.history.flat();
  console.log(database);
  frame = 0;
  updateFrame();
  const graph = db.map;
  document.getElementById("help").style.display = "none";
  MARGIN = 0.5 / new Set(Object.values(graph.xy).map(coord => coord[0])).size;
  NODE_SIZE = Math.min(width, height) * MARGIN * 0.8;
  const nodes = Object.keys(database[0].owner).map(node => {
    const fx = graph.xy ? (graph.xy[node][0] / 4 + 0.5) * width * (1 - 2 * MARGIN) + width * MARGIN : null;
    const fy = graph.xy ? (graph.xy[node][1] / 4 + 0.5) * height * (1 - 2 * MARGIN) + height * MARGIN : null;
    return {
      name: node,
      type: database[0].owner[node] === -1 ? "Fort" : "Base",
      owner: database[0].owner[node],
      power: database[0].power[node],
      fx,
      fy
    };
  });
  const links = [];
  Object.keys(graph.edges).forEach(source => {
    graph.edges[source].forEach(target => {
      if (target > source) links.push({
        source: source - 1,
        target: target - 1
      });
    });
  });
  loadMap({
    nodes,
    links
  });
}

function userAction(data) {
  const army = [];
  const battle = [];
  Object.values(data.actions).forEach((action, owner) => {
    for (let [from, to, radius] of action) {
      army.push({
        from,
        to,
        radius,
        owner
      });
    }
  });
  Object.values(data.power).forEach((power, index) => {
    if (power[0] > 0 && power[1] > 0) {
      battle.push(index);
    }
  });
  console.log(battle);
  if (army.length === 0) return updateMap(data);

  d3.select(".layout")
    .selectAll(".army")
    .data(army)
    .enter()
    .append("text")
    .text("\uf135")
    .style("font-size", "0px")
    .classed("fas", true)
    .style("fill", (d, i) => colors[d.owner + 1][3])
    .style("fill-opacity", "0.7")
    .attr("x", d => d3.select("#node-" + d.from).attr("cx"))
    .attr("y", d => d3.select("#node-" + d.from).attr("cy"))
    .transition()
    .duration(TRANSITION_ARMY_FADE)
    .style("font-size", d => normalize(d.radius))
    .attr("text-anchor", "middle")
    .transition()
    .duration(TRANSITION_ARMY_MOVE)
    .attr("x", d => d3.select("#node-" + d.to).attr("cx"))
    .attr("y", d => d3.select("#node-" + d.to).attr("cy"))
    .transition()
    .duration(TRANSITION_ARMY_FADE)
    .style("font-size", "0px")
    .remove()
    .on("end", () => {
      setTimeout(() => updateMap(data), TRANSITION_ARMY_FADE);
    });
}

document.body.addEventListener("dragover", event => event.preventDefault(), false);
document.body.addEventListener("drop", dropHandler, false);

function forward() {
  if (!database.length || frame === database.length - 1) return;
  frame++;
  updateFrame();
  userAction(database[frame]);
}
document.querySelector(".fa-step-forward").addEventListener("click", forward);

function backward() {
  if (!database.length || frame === 0) return;
  frame--;
  updateFrame();
  updateMap(database[frame]);
}
document.querySelector(".fa-step-backward").addEventListener("click", backward);

document.querySelector(".fa-question-circle").addEventListener("click", () => {
  alert("可以拖动节点到固定位置。单击节点将其复位。颜色代表节点的所有者。数字代表兵力。点击对应的按钮或键盘上的左、右箭头键来显示上一帧/下一帧。将图片拖入网页中可设置为背景图。");
});

document.addEventListener("keydown", event => {
  switch (event.key) {
    case "ArrowRight":
      forward();
      break;
    case "ArrowLeft":
      backward();
      break;
  }
});

if (location.hostname === "localhost") {

  fetch(`/battle.json?dummy=${Date.now()}`)
    .then(response => response.json())
    .then(loadData)
    .catch(() => { });

}

if (localStorage.getItem("background-image")) {
  document.body.style.setProperty("background-image", localStorage.getItem("background-image"));
}
