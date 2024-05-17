source .env

sui client ptb \
    --move-call ${PACKAGE_ID}::contract::inner \
        @$WRAPPER \
    --assign inner \
    --move-call ${PACKAGE_ID}::contract::use_inner_ref \
        inner \
    --gas-budget 100_000_000 \
    --summary

