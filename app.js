const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let dbPath = path.join(__dirname, "covid19India.db");
let dbConnectionObject = null;
const initializeDBandServer = async () => {
  try {
    dbConnectionObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server starts at port number 3001");
    });
  } catch (error) {
    console.log(`ERROR : ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();
//API 1 states:
app.get("/states/", async (requestObject, responseObject) => {
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const statesQuery = `SELECT * FROM state;`;
  const dbResponse = await dbConnectionObject.all(statesQuery);
  //console.log(dbResponse);//array of objects as output
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      stateId: eachObject.state_id,
      stateName: eachObject.state_name,
      population: eachObject.population,
    };
  });
  responseObject.send(dbResponseResult);
});

//API 2 states:

app.get("/states/:stateId/", async (requestObject, responseObject) => {
  const stateIdObject = requestObject.params;
  //console.log(stateIdObject);
  const { stateId } = stateIdObject;
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const statesQuery = `SELECT * FROM state WHERE state_id=${stateId}`;
  const dbResponse = await dbConnectionObject.get(statesQuery);
  //console.log(dbResponse);
  const dbResponseResult = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
  responseObject.send(dbResponseResult);
});

//API 3 districts:
app.post("/districts/", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  {
  "districtName": "Bagalkot",
  "stateId": 3,
  "cases": 2323,
  "cured": 2000,
  "active": 315,
  "deaths": 8
}
  */
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const districtQuery = `
  INSERT INTO district(district_name, state_id, cases, cured, active, deaths )
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  `;
  await dbConnectionObject.run(districtQuery);
  responseObject.send("District Successfully Added");
});

//API 4 districts:
app.get("/districts/:districtId/", async (requestObject, responseObject) => {
  const districtIdObject = requestObject.params;
  const { districtId } = districtIdObject;
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}

  const districtQuery = `SELECT * FROM district WHERE district_id=${districtId}`;
  const dbResponse = await dbConnectionObject.get(districtQuery);
  //console.log(dbResponse);
  const dbResponseResult = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };
  responseObject.send(dbResponseResult);
});

//API 5 districts:
app.delete("/districts/:districtId/", async (requestObject, responseObject) => {
  const districtsIdObject = requestObject.params;

  const { districtId } = districtsIdObject;
  const districtQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await dbConnectionObject.run(districtQuery);
  responseObject.send("District Removed");
});

//API 6 districts:
app.put("/districts/:districtId/", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  {
  "districtName": "Nadia",
  "stateId": 3,
  "cases": 9628,
  "cured": 6524,
  "active": 3000,
  "deaths": 104
}
  */
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const districtsIdObject = requestObject.params;

  const { districtId } = districtsIdObject;
  const districtQuery = `
  UPDATE district SET district_name='${districtName}',state_id=${stateId},
  cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId};
  `;
  const dbResponse = await dbConnectionObject.run(districtQuery);
  //console.log(dbResponse);
  responseObject.send("District Details Updated");
});

//API 7 States:
app.get("/states/:stateId/stats/", async (requestObject, responseObject) => {
  const statedID = requestObject.params.stateId; //id is in route path
  //console.log(statedID); //1
  const stateQuery = `
  SELECT  SUM(cases) AS totalCases,SUM(cured) AS totalCured,
  SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
  FROM state INNER JOIN district ON state.state_id=district.state_id
  WHERE state.state_id= ${statedID};
  `;
  const dbResponse = await dbConnectionObject.get(stateQuery);
  responseObject.send(dbResponse);
});

//API 8 districts:
app.get(
  "/districts/:districtId/details/",
  async (requestObject, responseObject) => {
    const districtID = requestObject.params.districtId;
    //console.log(districtID);//31
    const districtQuery = `
    SELECT state_name AS stateName
    FROM state INNER JOIN district
    ON state.state_id=district.state_id
    WHERE district.district_id=${districtID};
    `;
    const dbResponse = await dbConnectionObject.get(districtQuery);
    responseObject.send(dbResponse);
  }
);

module.exports = app;
