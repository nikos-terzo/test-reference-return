
/// Module: contract
module contract::contract {

    public struct Wrapper has key {
        id: UID,
        inner: Inner
    }

    public struct Inner has key, store {
        id: UID,
    }


    fun init(ctx: &mut TxContext) {
        transfer::share_object(
            Wrapper{
                id: object::new(ctx),
                inner: Inner{
                    id: object::new(ctx)
                }
            }
        );
    }

    public fun inner(wrapper: &Wrapper): &Inner {
        &wrapper.inner
    }

    public fun use_inner_ref(_: &Inner) {
        // do nothing
    }
}

