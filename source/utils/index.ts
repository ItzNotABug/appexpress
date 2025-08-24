/** Utility functions for AppExpress */

import type { AppExpressRequestMethods } from '../types/index.js';

/**
 * Creates and returns a new set of request method maps.
 *
 * @returns A new instance of request method maps for routing.
 */
export function requestMethods(): AppExpressRequestMethods {
    return {
        get: new Map(),
        post: new Map(),
        put: new Map(),
        patch: new Map(),
        delete: new Map(),
        options: new Map(),
        all: new Map(),
    };
}

/**
 * Returns a function that checks if a given content type is compressible.
 *
 * @param contentType The content type to check
 * @returns Returns true if the content type is compressible.
 */
export const isCompressible = (contentType: string): boolean => {
    const contentTypePatterns = [
        /^text\/(html|css|plain|xml|x-component|javascript)$/i,
        /^application\/(x-javascript|javascript|json|manifest\+json|vnd\.api\+json|xml|xhtml\+xml|rss\+xml|atom\+xml|vnd\.ms-fontobject|x-font-ttf|x-font-opentype|x-font-truetype)$/i,
        /^image\/(svg\+xml|x-icon|vnd\.microsoft\.icon)$/i,
        /^font\/(ttf|eot|otf|opentype)$/i,
    ];

    for (const pattern of contentTypePatterns) {
        if (pattern.test(contentType)) return true;
    }

    return false;
};
