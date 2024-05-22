import * as React from 'react';

type IndexLandingPageProps = {
    title: string;
    slogan: string;
    developer: {
        url: string;
        handle: string;
    };
    renderType: string;
};

const IndexLandingPage = ({
    title,
    slogan,
    developer,
    renderType,
}: IndexLandingPageProps) => {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <title>{title}</title>
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

                    html {
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #000, #f02e65);
                        font-family: Roboto, sans-serif;
                        color: #fff;
                        overflow: auto;
                    }

                    .container {
                        text-align: center;
                        max-width: 600px;
                        padding: 20px;
                    }

                    .logo {
                        font-size: 3rem;
                        font-weight: 700;
                        color: inherit;
                    }

                    .slogan {
                        font-size: 1.2rem;
                        margin-top: 20px;
                        line-height: 1.75;
                    }

                    .action-button {
                        margin-top: 40px;
                        padding: 12px 24px;
                        font-size: 1.1rem;
                        border: 2px solid #fff;
                        background-color: transparent;
                        color: #fff;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        outline: 0;
                        border-radius: 25px;
                    }

                    .action-button:hover {
                        background-color: #fff;
                        color: #000;
                    }

                    footer {
                        text-align: center;
                        padding: 20px 0;
                        position: absolute;
                        bottom: 0;
                        width: 100%;
                        font-size: 0.8rem;
                    }

                    footer a {
                        color: #fff;
                    }
                `,
                    }}
                />
            </head>
            <body>
                <div className="container">
                    <div className="logo">{title}</div>
                    <div
                        className="slogan"
                        dangerouslySetInnerHTML={{ __html: slogan }}
                    />
                    <button
                        className="action-button"
                        onClick={() =>
                            window.open(
                                'https://github.com/itznotabug/appexpress',
                                '_blank',
                            )
                        }
                    >
                        Learn More
                    </button>
                </div>
                <footer>
                    Built by{' '}
                    <a
                        href={developer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {developer.handle}
                    </a>
                    <p>{renderType}</p>
                </footer>
            </body>
        </html>
    );
};

export default IndexLandingPage;
