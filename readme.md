# critical-cli
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

## Configuration
The following configuration options can be passed to the `run` command.

| Option | Default | Description |
| -------- | -------- | -------- |
| url | N/A | the URL(s) to check |
| output | `./screenshots` | output path for page screenshots |
| width | 1024 | viewport width used for critical CSS comparison |
| height | 768 | viewport height used for critical CSS comparison |
| timeout | 1000 | timeout in milliseconds for loading stylesheets |

**Example:**
```
critical-cli run --url https://johannespichler.com --output ./other-dir --width 1920 --height 1080 --timeout 5000
```

## Output
The CLI generates two screenshots of the website and also a diff between them.

| Critical version | Normal Version | Diff |
| -------- | -------- | -------- |
| ![](examples/example.com-a.png) | ![](examples/example.com-b.png) | ![](examples/example.com-diff.png) |
| ![](examples/jopic.at-a.png) | ![](examples/jopic.at-b.png) | ![](examples/jopic.at-diff.png) |

This makes it easy to determine the problems with your critical CSS.

## License

The MIT License (MIT). Please see the [License File](LICENSE) for more information.