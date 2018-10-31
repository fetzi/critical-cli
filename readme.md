# critical-critical
critical-cli is a CLI tool for validating critical CSS on a certain website.

Basically the website is loaded without stylesheets at first and compared against a version with loaded stylesheets. If the generated screenshots do not match the critical CSS on the page is considered as incorrect.

## Installation
```
npm i critical-cli --save-dev
```

## Usage
The CLI application provides a run command to validate critical CSS:

```
critical-cli run --url https://johannespichler.com
```

If the critical CSS validation for the page fails the application will exit with an exit code of `1`.