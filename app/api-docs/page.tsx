"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";

const groupedRoutes = {
  users: [
    {
      method: "POST",
      path: "/api/users",
      description: "Créer un utilisateur par admin",
    },
    {
      method: "GET",
      path: "/api/users",
      description: "Lister tous les utilisateurs",
    },
    {
      method: "GET",
      path: "/api/users/:id",
      description: "Récupérer un utilisateur par ID",
    },
    {
      method: "PUT",
      path: "/api/users/:id",
      description: "Modifier un utilisateur",
    },
    {
      method: "DELETE",
      path: "/api/users/:id",
      description: "Supprimer un utilisateur",
    },
  ],
  products: [
    {
      method: "POST",
      path: "/api/products",
      description: "Créer un nouveau produit",
    },
    {
      method: "GET",
      path: "/api/products",
      description: "Lister tous les produits",
    },
    {
      method: "GET",
      path: "/api/products/:id",
      description: "Récupérer un produit par ID",
    },
    {
      method: "PUT",
      path: "/api/products/:id",
      description: "Modifier un produit",
    },
    {
      method: "DELETE",
      path: "/api/products/:id",
      description: "Supprimer un produit",
    },
    {
      method: "GET",
      path: "/api/products/reference/:reference",
      description: "Récupérer un produit par sa Reference",
    },
  ],
};

type RouteTestState = {
  id?: string;
  reference?: string;
  body?: string;
  response?: string | null;
};

export default function ApiDocsPage() {
  const [routeState, setRouteState] = useState<Record<string, RouteTestState>>(
    {}
  );

  const [adminToken, setAdminToken] = useState<string>("");

  const handleChange = (
    key: string,
    field: keyof RouteTestState,
    value: string
  ) => {
    setRouteState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const getTokenAdmin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: routeState["loginEmail"]?.body,
          password: routeState["loginPassword"]?.body,
        }),
      });

      const data = await res.json();
      if (data.token) {
        setAdminToken(data.token);
      } else {
        setAdminToken("Erreur de connexion");
      }
    } catch (error) {
      setAdminToken("Erreur réseau");
    }
  };

  const testRoute = async (key: string, method: string, path: string) => {
    const { id = "", body = "", reference = "" } = routeState[key] || {};

    let finalPath = path.includes(":id") ? path.replace(":id", id) : path;
    if (path.includes(":reference"))
      finalPath = path.includes(":reference")
        ? path.replace(":reference", reference)
        : path;

    try {
      const res = await fetch(finalPath, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`, // Ajout du token d'admin ici
        },
        body:
          method === "POST" || method === "PUT"
            ? JSON.stringify(JSON.parse(body))
            : undefined, // JSON.stringify après JSON.parse pour assurer que c'est un JSON valide
      });

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await res.json()
        : await res.text();

      handleChange(
        key,
        "response",
        `${res.status} ${res.statusText}\n\n${JSON.stringify(data, null, 2)}`
      );
    } catch (err) {
      handleChange(key, "response", "❌ Erreur lors de la requête");
    }
  };

  return (
    <ScrollArea className="p-8 max-w-6xl mx-auto text-foreground">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">📘 API Documentation</h1>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between gap-4">
          <Input
            placeholder="Email"
            value={routeState["loginEmail"]?.body || ""}
            onChange={(e) => handleChange("loginEmail", "body", e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={routeState["loginPassword"]?.body || ""}
            onChange={(e) =>
              handleChange("loginPassword", "body", e.target.value)
            }
          />
          <Button onClick={async () => getTokenAdmin()}>
            Valider le Token
          </Button>
        </div>
        <p style={{ overflowWrap: "anywhere" }}>
          Token d'admin: <span>{adminToken}</span>
        </p>
      </div>

      {Object.entries(groupedRoutes).map(([resource, routes]) => (
        <div
          key={resource}
          className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 capitalize">{resource}</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route, index) => {
              const key = `${route.method}_${route.path}_${index}`;
              const state = routeState[key] || {};

              return (
                <Card
                  key={key}
                  className="border border-muted bg-background text-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`uppercase border-none ${
                          route.method === "GET"
                            ? "bg-green-500 text-white"
                            : route.method === "POST"
                            ? "bg-blue-500 text-white"
                            : route.method === "PUT"
                            ? "bg-yellow-500 text-black"
                            : "bg-red-500 text-white"
                        }`}>
                        {route.method}
                      </Badge>
                      <code className="text-sm break-all">{route.path}</code>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{route.description}</p>

                    {route.path.includes(":id") && (
                      <Input
                        placeholder="ID"
                        value={state.id || ""}
                        onChange={(e) =>
                          handleChange(key, "id", e.target.value)
                        }
                      />
                    )}

                    {route.path.includes(":reference") && (
                      <Input
                        placeholder="Ref"
                        value={state.reference || ""}
                        onChange={(e) =>
                          handleChange(key, "reference", e.target.value)
                        }
                      />
                    )}

                    {route.method === "PUT" && (
                      <Textarea
                        placeholder='{"name": "John", "email": "john@mail.com"}'
                        value={state.body || ""}
                        onChange={(e) =>
                          handleChange(key, "body", e.target.value)
                        }
                      />
                    )}

                    {route.method === "POST" && (
                      <Textarea
                        placeholder='{
                          "email": "newuser@example.com",
                          "password": "password123",
                          "name": "John Doe",
                          "role": "USER"
                          }'
                        value={state.body || ""}
                        onChange={(e) =>
                          handleChange(key, "body", e.target.value)
                        }
                      />
                    )}

                    <Button
                      onClick={() => testRoute(key, route.method, route.path)}
                      style={{ cursor: "pointer" }}>
                      Tester
                    </Button>

                    {state.response && (
                      <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-words">
                        {state.response}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </ScrollArea>
  );
}
