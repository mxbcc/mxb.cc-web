/* This code is lifted from the Next.js Apollo example. See
https://github.com/zeit/next.js/blob/canary/examples/with-apollo */

import * as React from 'react';
import { initApollo } from './init-apollo';
import Head from 'next/head';
import { getDataFromTree } from '@apollo/client/react/ssr';

export const withApollo = App => {
    return class Apollo extends React.Component {
        static displayName = 'withApollo(App)';

        static async getInitialProps(ctx) {
            const {
                Component,
                router,
                ctx: { res },
            } = ctx;

            // Run all GraphQL queries in the component tree
            // and extract the resulting data
            const apollo = initApollo();

            ctx.ctx.apolloClient = apollo;

            let appProps = {};
            if (App.getInitialProps) {
                appProps = await App.getInitialProps(ctx);
            }

            if (res && res.finished) {
                // When redirecting, the response is finished.
                // No point in continuing to render
                return {};
            }

            if (!process.browser) {
                try {
                    // Run all GraphQL queries
                    await getDataFromTree(
                        <App {...appProps} Component={Component} router={router} apolloClient={apollo}/>
                    );
                } catch (error) {
                    // Prevent Apollo Client GraphQL errors from crashing SSR.
                    // Handle them in components via the data.error prop:
                    // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
                    console.error('Error while running `getDataFromTree`', JSON.stringify(error));
                }
            }

            // Extract query data from the Apollo store
            const apolloState = apollo.cache.extract();

            return {
                ...appProps,
                apolloState,
            };
        }

        private readonly apolloClient;

        constructor(props) {
            super(props);
            this.apolloClient = initApollo(props.apolloState);
        }

        render() {
            return <App {...this.props} apolloClient={this.apolloClient}/>;
        }
    };
};
