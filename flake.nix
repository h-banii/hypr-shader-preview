{
  outputs =
    {
      nixpkgs,
      systems,
      ...
    }:
    let
      inherit (nixpkgs) lib;
      forAllSystems = lib.genAttrs (import systems);
      pkgsFor = forAllSystems (system: nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = pkgsFor.${system};
        in
        {
          default = pkgs.mkShell {
            name = "hypr-shader-preview-devshell";
            buildInputs = with pkgs; [
              nodejs
              typescript-language-server
              vscode-langservers-extracted
            ];
          };
        }
      );
    };
}
