json -I -f ./node_modules/@gemworks/gem-farm-ts/package.json -e 'this.browser={"fs": false,"path": false,"os": false}'
json -I -f ./node_modules/@gemworks/gem-farm-ts/node_modules/@project-serum/anchor/package.json -e 'this.browser={"fs": false,"path": false,"os": false}'
cat ./node_modules/@gemworks/gem-farm-ts/package.json
cat ./node_modules/@gemworks/gem-farm-ts/node_modules/@project-serum/anchor/package.json

