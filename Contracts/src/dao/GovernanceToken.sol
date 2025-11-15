// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20Votes, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_00 * 10 ** 18; //100k
    address public jobContract;
    constructor()
        Ownable(msg.sender)
        ERC20("NeuroSigil", "NSG")
        ERC20Permit("NeuroSigil") // Needed for off-chain signatures
    {
        _mint(msg.sender, 1000000000);
    }

    function setJobContract(address _jobContract) external onlyOwner {
        require(_jobContract != address(0), "Invalid job contract");
        jobContract = _jobContract;
    }

    function rewardUser(address user, uint256 amount) external {
        require(msg.sender == jobContract, "Only JobContract");
        require(totalSupply() + amount <= MAX_SUPPLY, "Cap reached");
        _mint(user, amount);
    }

    // Required overrides

    /* There are two _update both in ERC20 and ERC20votes I need to override them to avoid confusion for solidity 
     so it is mandatory to override this.
    */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}

//SomeOne knows a hot proposal is comming up
//so they buy a ton of token then dump it after
//Snapshot of token at a certain block
