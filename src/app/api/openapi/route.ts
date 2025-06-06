import { NextResponse } from 'next/server'

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "YPAI - Yellow Pages AI API",
      description: "Bulgarian Business Directory API optimized for AI agents and intelligent assistants. Discover businesses, categories, and comprehensive business data across Bulgaria.",
      version: "1.0.0",
      contact: {
        name: "YPAI API Support",
        url: "https://ypai.vercel.app/api-docs",
        email: "api@ypai.bg"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      },
      termsOfService: "https://ypai.vercel.app/terms"
    },
    servers: [
      {
        url: "https://ypai.vercel.app/api",
        description: "Production API Server"
      }
    ],
    tags: [
      {
        name: "businesses",
        description: "Business directory operations - Core data for AI agents"
      },
      {
        name: "categories", 
        description: "Business category management"
      },
      {
        name: "ai",
        description: "AI-optimized endpoints for intelligent assistants"
      }
    ],
    paths: {
      "/businesses": {
        get: {
          tags: ["businesses"],
          summary: "Get all businesses",
          description: "Retrieve comprehensive list of Bulgarian businesses. Supports filtering by category, location, and search terms. Optimized for AI agent consumption.",
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Search term for business name or description",
              required: false,
              schema: {
                type: "string",
                example: "ресторант софия"
              }
            },
            {
              name: "category",
              in: "query", 
              description: "Filter by business category slug",
              required: false,
              schema: {
                type: "string",
                example: "restaurants"
              }
            },
            {
              name: "city",
              in: "query",
              description: "Filter by city name",
              required: false,
              schema: {
                type: "string",
                example: "София"
              }
            },
            {
              name: "limit",
              in: "query",
              description: "Maximum number of results (default: 50, max: 100)",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 50
              }
            },
            {
              name: "offset",
              in: "query",
              description: "Number of results to skip for pagination",
              required: false,
              schema: {
                type: "integer",
                minimum: 0,
                default: 0
              }
            }
          ],
          responses: {
            "200": {
              description: "Successful response with business data",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Business"
                    }
                  },
                  example: [
                    {
                      id: 1,
                      name: "Техномагия ЕООД",
                      description: "Водещ доставчик на IT решения в България",
                      address: "бул. Витоша 123, София",
                      phone: "+359 2 123 4567",
                      email: "info@technomagic.bg",
                      website: "https://technomagic.bg",
                      category: "Технологии",
                      category_slug: "technology",
                      category_icon: "💻",
                      created_at: "2025-06-06T10:00:00Z"
                    }
                  ]
                }
              }
            }
          }
        },
        post: {
          tags: ["businesses"],
          summary: "Create new business",
          description: "Add a new business to the directory. Requires admin access.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BusinessCreate"
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Business created successfully"
            },
            "400": {
              description: "Invalid input data"
            }
          }
        }
      },
      "/categories": {
        get: {
          tags: ["categories"],
          summary: "Get all business categories",
          description: "Retrieve all available business categories with icons and slugs",
          responses: {
            "200": {
              description: "List of business categories",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Category"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/ai/search": {
        get: {
          tags: ["ai"],
          summary: "AI-optimized business search",
          description: "Enhanced search endpoint designed for AI agents with intelligent matching and semantic search capabilities",
          parameters: [
            {
              name: "query",
              in: "query",
              description: "Natural language search query",
              required: true,
              schema: {
                type: "string",
                example: "най-добрите ресторанти за италианска кухня в София"
              }
            },
            {
              name: "intent",
              in: "query",
              description: "Search intent classification",
              required: false,
              schema: {
                type: "string",
                enum: ["find_business", "get_contact", "compare_options", "get_reviews"],
                example: "find_business"
              }
            }
          ],
          responses: {
            "200": {
              description: "AI-enhanced search results with relevance scoring",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      results: {
                        type: "array",
                        items: {
                          allOf: [
                            { $ref: "#/components/schemas/Business" },
                            {
                              type: "object",
                              properties: {
                                relevance_score: {
                                  type: "number",
                                  description: "AI-calculated relevance score (0-1)"
                                },
                                match_reasons: {
                                  type: "array",
                                  items: { type: "string" },
                                  description: "Why this business matched the query"
                                }
                              }
                            }
                          ]
                        }
                      },
                      query_analysis: {
                        type: "object",
                        properties: {
                          intent: { type: "string" },
                          location: { type: "string" },
                          category: { type: "string" },
                          keywords: {
                            type: "array",
                            items: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Business: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Unique business identifier"
            },
            name: {
              type: "string",
              description: "Business name"
            },
            description: {
              type: "string",
              description: "Business description"
            },
            address: {
              type: "string",
              description: "Physical address"
            },
            phone: {
              type: "string",
              description: "Contact phone number"
            },
            email: {
              type: "string",
              format: "email",
              description: "Contact email"
            },
            website: {
              type: "string",
              format: "uri",
              description: "Business website URL"
            },
            category: {
              type: "string",
              description: "Business category name"
            },
            category_slug: {
              type: "string",
              description: "URL-friendly category identifier"
            },
            category_icon: {
              type: "string",
              description: "Category emoji icon"
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp"
            }
          },
          required: ["id", "name", "description"]
        },
        BusinessCreate: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
            website: { type: "string", format: "uri" },
            category_id: { type: "integer" }
          },
          required: ["name", "description", "category_id"]
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            slug: { type: "string" },
            icon: { type: "string" },
            created_at: { type: "string", format: "date-time" }
          }
        }
      }
    },
    externalDocs: {
      description: "YPAI Integration Guide for AI Agents",
      url: "https://ypai.vercel.app/api-docs"
    }
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}