
#!/bin/bash

# check dependencies are available.
for i in jq curl sui; do
  if ! command -V ${i} 2>/dev/null; then
    echo "${i} is not installed"
    exit 1
  fi
done
cwd=$(pwd)
script_dir=$(dirname "$0")

MOVE_PACKAGE_PATH=${cwd}/${script_dir}/
GAS_BUDGET=900000000 # 0.9 SUI (Usually it is less than 0.5 SUI)

echo "Publishing"
publish_res=$(sui client publish --skip-fetch-latest-git-deps --with-unpublished-dependencies --gas-budget ${GAS_BUDGET} --json ${MOVE_PACKAGE_PATH})
echo ${publish_res} >.publish.res.json

# Check if the command succeeded (exit status 0)
if [[ "$publish_res" =~ "error" ]]; then
  # If yes, print the error message and exit the script
  echo "Error during move contract publishing.  Details : $publish_res"
  exit 1
fi

# Parse PACKAGE_ID, WRAPPER from the publish response
published_objs=$(echo "$publish_res" | jq -r '.objectChanges[] | select(.type == "published")')
PACKAGE_ID=$(echo "$published_objs" | jq -r '.packageId')

new_objs=$(echo "$publish_res" | jq -r '.objectChanges[] | select(.type == "created")')
WRAPPER=$(echo "$new_objs" | jq -r 'select(.objectType | endswith("::contract::Wrapper")).objectId')

suffix=""
if [ $# -eq 0 ]; then
  suffix=".localnet"
fi

cat >./.env<<-_ENV
PACKAGE_ID=$PACKAGE_ID
WRAPPER=$WRAPPER

_ENV

echo "Contract Deployment finished!"

