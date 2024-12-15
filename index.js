// import { parse } from "./node_modules/csv-parse/lib/sync";
import fs from "fs";

const csv = fs.readFileSync("csv/data.csv");
console.log(csv.toString());
