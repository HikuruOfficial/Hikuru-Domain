// SPDX-License-Identifier: MIT
// author: Hikuru Labs
pragma solidity ^0.8.20;

// Importing OpenZeppelin contracts for ERC1155, Ownable, and ERC1155Supply functionality
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

interface IFeeClaimer {
    function deposit(address _user, uint8 _type) external payable returns (bool);
    function depositERC20(address _user, address _token, uint256 _amount, uint8 _type) external returns (bool);
}


// HikuruDomain contract definition, inheriting from ERC1155, Ownable, and ERC1155Supply
contract HikuruDomain is ERC1155, Ownable, ERC1155Supply {
    // State variables
    uint256 private currentId = 1; // Variable to track the current token ID for NFTs
    uint256 public MINTING_FEE = 0.0004 ether; // Fee for minting an NFT
    mapping(uint256 => string) private _URIs; // Mapping of token IDs to their URIs
    mapping(uint256 => string) private _usernames; // Mapping of token IDs to usernames
    mapping(address => bool) public isOwner; // Mapping to track owner addresses
    mapping(address => bool) public isMinted; // Mapping to track user mint already
    mapping(address => uint256) public referralsInviteCount; // Mapping to track how many reff invited
    IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);

    address public HIKURU_PIGGY_BANK;
    address public HIKURU_FEE_CLAIMER;
    IFeeClaimer private FeeClaimer;


    // Modifier that checks that the caller is one of the owners
    // Modifier that checks that the caller is one of the owners
    modifier onlyHikuruOwner() {
        require(isOwner[msg.sender], "Caller is not an owner");
        _; // Continue execution
    }

    // Constructor sets up the initial owner and the piggy bank address
    constructor(address initialOwner, address _hikuruPiggyBank, address _feeClaimer) ERC1155("") Ownable(initialOwner) {
        //contract balance will grow automatically
        BLAST.configureClaimableYield();
        BLAST.configureClaimableGas(); 

        isOwner[initialOwner] = true;
        HIKURU_PIGGY_BANK = _hikuruPiggyBank;
        HIKURU_FEE_CLAIMER = _feeClaimer;
        FeeClaimer = IFeeClaimer(_feeClaimer);
    }

    function claimAllYield(address recipient) external onlyHikuruOwner {
        // allow only the owner to claim the yield
        BLAST.claimAllYield(address(this), HIKURU_PIGGY_BANK);
    }

    function claimMyContractsGas() external onlyHikuruOwner {
        // allow only the owner to claim the gas
        BLAST.claimAllGas(address(this), HIKURU_PIGGY_BANK);
    }

    // Function to mint new NFTs
    function mint(address to, string memory uri_, string memory username_) public payable {
        require(!isMinted[to], "Cant mint username again"); // Ensure the caller is whitelisted
        require(msg.value >= MINTING_FEE, "Incorrect payment"); // Ensure the correct payment is sent

        // Transfer the minting fee to the hikuru piggy bank
        (bool feeTransferSuccess, ) = HIKURU_PIGGY_BANK.call{value: msg.value}("");
        require(feeTransferSuccess, "Fee transfer failed");

        uint256 newId = currentId++; // Increment the current ID for the new NFT

        _mint(to, newId, 1, ""); // Mint the new NFT
        _URIs[newId] = uri_; // Set the URI for the new NFT
        _usernames[newId] = username_; // Set the username for the new NFT
    }

    function mint(address to, string memory uri_, string memory username_, address referralAddress) public payable {
        require(!isMinted[to], "Cant mint username again"); // Ensure the caller is whitelisted
        require(msg.value >= MINTING_FEE, "Incorrect payment"); // Ensure the correct payment is sent

        // Calculate the referral fee as half of the minting fee
        uint256 referralFee = msg.value / 2;

        // transfer fee to piggy bank
        (bool status_pg, )=HIKURU_PIGGY_BANK.call{value: referralFee}("");
        require(status_pg, "PB: Transfer failed");
        bool status_rf=FeeClaimer.deposit{value: referralFee}(referralAddress, 3);
        require(status_rf, "RF: Transfer failed");

        uint256 newId = currentId++; // Increment the current ID for the new NFT

        _mint(to, newId, 1, ""); // Mint the new NFT
        referralsInviteCount[referralAddress]+=1;
        _URIs[newId] = uri_; // Set the URI for the new NFT
        _usernames[newId] = username_; // Set the username for the new NFT
    }


    // Function for the owner to set the URI of a specific token
    function setURI(uint256 tokenId, string memory newuri) public onlyHikuruOwner {
        _URIs[tokenId] = newuri;
    }

    // Function to get the URI of a specific token
    function uri(uint256 tokenId) override public view returns (string memory) {
        return _URIs[tokenId];
    }

    // Function to get the username associated with a specific token
    function username(uint256 tokenId) public view returns (string memory) {
        return _usernames[tokenId];
    }

    // Function for the owner to update the minting fee
    function updateMintingFee(uint256 newFee) public onlyHikuruOwner {
        MINTING_FEE = newFee;
    }

    // update the piggy bank
    function updatePiggyBank(address _newPiggyBank) public onlyHikuruOwner {
        HIKURU_PIGGY_BANK = _newPiggyBank;
    }

    function updateFeeClaimer(address _newFeeClaimer) public onlyHikuruOwner {
        HIKURU_FEE_CLAIMER = _newFeeClaimer;
        FeeClaimer = IFeeClaimer(_newFeeClaimer);
    }
    
    // Function for the owner to add a new owner
    function addOwner(address newOwner) public onlyHikuruOwner {
        require(newOwner != address(0), "New owner is the zero address");
        isOwner[newOwner] = true;
    }

    // Function for the owner to remove an existing owner
    function removeOwner(address owner) public onlyHikuruOwner {
        isOwner[owner] = false;
    }

    // Internal override function to update token balances, ensuring consistency with ERC1155Supply
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}



enum YieldMode {
    AUTOMATIC,
    VOID,
    CLAIMABLE
}

enum GasMode {
    VOID,
    CLAIMABLE 
}

interface IBlast{
    // configure
    function configureContract(address contractAddress, YieldMode _yield, GasMode gasMode, address governor) external;
    function configure(YieldMode _yield, GasMode gasMode, address governor) external;

    // base configuration options
    function configureClaimableYield() external;
    function configureClaimableYieldOnBehalf(address contractAddress) external;
    function configureAutomaticYield() external;
    function configureAutomaticYieldOnBehalf(address contractAddress) external;
    function configureVoidYield() external;
    function configureVoidYieldOnBehalf(address contractAddress) external;
    function configureClaimableGas() external;
    function configureClaimableGasOnBehalf(address contractAddress) external;
    function configureVoidGas() external;
    function configureVoidGasOnBehalf(address contractAddress) external;
    function configureGovernor(address _governor) external;
    function configureGovernorOnBehalf(address _newGovernor, address contractAddress) external;

    // claim yield
    function claimYield(address contractAddress, address recipientOfYield, uint256 amount) external returns (uint256);
    function claimAllYield(address contractAddress, address recipientOfYield) external returns (uint256);

    // claim gas
    function claimAllGas(address contractAddress, address recipientOfGas) external returns (uint256);
    function claimGasAtMinClaimRate(address contractAddress, address recipientOfGas, uint256 minClaimRateBips) external returns (uint256);
    function claimMaxGas(address contractAddress, address recipientOfGas) external returns (uint256);
    function claimGas(address contractAddress, address recipientOfGas, uint256 gasToClaim, uint256 gasSecondsToConsume) external returns (uint256);

    // read functions
    function readClaimableYield(address contractAddress) external view returns (uint256);
    function readYieldConfiguration(address contractAddress) external view returns (uint8);
    function readGasParams(address contractAddress) external view returns (uint256 etherSeconds, uint256 etherBalance, uint256 lastUpdated, GasMode);
}
