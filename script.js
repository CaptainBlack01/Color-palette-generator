let button = document.getElementById("button");
let firstColorBox = document.getElementById("first-color-box");
let secondColorBox = document.getElementById("second-color-box");
let thirdColorBox = document.getElementById("third-color-box");
let firstHexCode = document.getElementById("first-hex-code");
let secondHexCode = document.getElementById("second-hex-code");
let thirdHexCode = document.getElementById("third-hex-code");
let hexaDecimalNumberSystem = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

function generateRandomNumber() {
  let result = Math.floor(Math.random() * hexaDecimalNumberSystem.length);
  return result;
}
console.log(generateRandomNumber());

button.addEventListener("click", function () {
  let hexCodeForFirstBox = "#";
  for (let i = 0; i < 6; i++) {
    hexCodeForFirstBox += hexaDecimalNumberSystem[generateRandomNumber()];
  }
  console.log(hexCodeForFirstBox);
  firstColorBox.style.backgroundColor = hexCodeForFirstBox;
  firstHexCode.textContent = hexCodeForFirstBox;

// second hex
  let hexCodeForSecondBox = "#";
  for (let i = 0; i < 6; i++) {
    hexCodeForSecondBox += hexaDecimalNumberSystem[generateRandomNumber()];
  }
  secondColorBox.style.backgroundColor = hexCodeForSecondBox;
  secondHexCode.textContent = hexCodeForSecondBox;

// third hex
  let hexCodeForThirdBox = "#";
  for (let i = 0; i < 6; i++) {
    hexCodeForThirdBox += hexaDecimalNumberSystem[generateRandomNumber()];
  }
  thirdColorBox.style.backgroundColor = hexCodeForThirdBox;
  thirdHexCode.textContent = hexCodeForThirdBox;
});
